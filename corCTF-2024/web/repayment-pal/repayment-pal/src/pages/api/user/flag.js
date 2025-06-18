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

    if (dbUser.balance <= 999_999_999_999_999n) {
      return res.status(403).send('sorry you are poor');
    }

    if (dbUser.user === "admin") {
      return res.status(403).send('hmmm... no');
    }

    await db.user.delete({
      where: {
        user: session.user,
      },
    });

    return res.status(200).send(process.env.FLAG || "flag{test_flag}");
  }
  res.status(405).end();
}