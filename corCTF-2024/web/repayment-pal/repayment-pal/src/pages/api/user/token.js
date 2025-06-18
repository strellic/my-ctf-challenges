import util from "@/util";
import db from "@/db";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const session = util.getSession(req, res);
    if (!session || !session.user) {
      return res.status(403).send('unauthorized');
    }

    const dbUser = await db.user.findUnique({
      where: { user: session.user }
    });

    if (!dbUser) {
      return res.status(403).send('unauthorized');
    }

    return res.status(200).send(dbUser.transferToken);
  }
  res.status(405).end();
}