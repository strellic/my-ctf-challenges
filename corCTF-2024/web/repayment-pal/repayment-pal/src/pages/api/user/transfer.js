import { fromError } from 'zod-validation-error';
import { z } from 'zod';

import util from "@/util";
import db from "@/db";

const schema = z.object({
  recipient: z.string(),
  message: z.string(),
  value: z.coerce.bigint(),
  transferToken: z.string()
}).required();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const session = util.getSession(req, res);
    if (!session || !session.user) {
      return res.status(403).send('unauthorized');
    }

    const { success, data, error } = schema.safeParse(req.body);
    if (!success) {
      return res.status(400).send(fromError(error).toString());
    }

    const { recipient, message, value, transferToken } = data;

    if (value <= 0n) {
      return res.status(400).send("value must be >= 0");
    }

    const dbUser = await db.user.findFirst({
      where: { transferToken }
    });

    if (!dbUser) {
      return res.status(400).send("invalid transfer token");
    }

    if (dbUser.user !== session.user) {
      return res.status(403).send('how did you get that transfer token?');
    }

    if (dbUser.balance < value) {
      return res.status(400).send("not enough balance");
    }

    const recipientUser = await db.user.findUnique({
      where: { user: recipient }
    });

    if (!recipientUser) {
      return res.status(400).send("unknown recipient");
    }

    if (recipientUser === "admin") {
      return res.status(400).send("they dont need more money");
    }

    if (recipientUser.user === dbUser.user) {
      return res.status(400).send("please be for real");
    }

    try {
      db.$transaction(async (tx) => {
        const sender = await tx.user.update({
          where: {
            user: dbUser.user
          },
          data: {
            balance: {
              // do not remove balance from admin
              decrement: dbUser.user === "admin" ? 0n : value
            },
            // update transfer token on each transfer
            transferToken: util.randomToken()
          }
        });

        if (sender.balance < 0n) {
          throw new Error("not enough balance");
        }

        await tx.user.update({
          data: {
            balance: {
              increment: value,
            },
            messages: recipientUser.messages + `\n` + `${dbUser.user}: ${message.replaceAll("\n", "")} (+$${value})`
          },
          where: {
            user: recipientUser.user
          },
        })
      });
    }
    catch (err) {
      return res.status(400).send(err.message);
    }

    return res.status(200).send('transfer successful!');
  }
  res.status(405).end();
}