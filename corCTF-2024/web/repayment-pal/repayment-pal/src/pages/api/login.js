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

    if (!await db.user.findUnique({ where: { user }})) {
      return res.status(400).send("no user exists with that name");
    }

    const dbUser = await db.user.findUnique({
      where: { user }
    });

    if (util.sha256(pass) !== dbUser.pass) {
      return res.status(400).send("incorrect password");
    }

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