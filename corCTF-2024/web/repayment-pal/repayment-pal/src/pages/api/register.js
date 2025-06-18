import { fromError } from 'zod-validation-error';
import { setCookie } from 'cookies-next';
import { z } from 'zod';

import util from "@/util";
import db from "@/db";

const schema = z.object({
  user: z.string().min(5).regex(/[A-Za-z0-9]+/),
  pass: z.string().min(7)
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { success, data, error } = schema.safeParse(req.body);
    if (!success) {
      return res.status(400).send(fromError(error).toString());
    }

    const { user, pass } = data;

    if (pass.includes(user)) {
      return res.status(400).send("please be serious");
    }

    if (await db.user.findUnique({ where: { user }})) {
      return res.status(400).send("a user already exists with that name");
    }

    await db.user.create({
      data: {
        user,
        pass: util.sha256(pass),
        balance: 5,
        transferToken: util.randomToken(),
        messages: `welcome, ${user}!`
      },
    });

    const session = util.jwtEncode({ user });
    setCookie("session", session, {
      sameSite: "strict",
      httpOnly: true,
      req, res
    });
    return res.status(200).send();
  }
  res.status(405).end();
}