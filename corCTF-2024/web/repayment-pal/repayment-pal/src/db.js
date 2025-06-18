import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

import util from "@/util";

// only start one instance
if (!globalThis.prisma) {
  globalThis.prisma = new PrismaClient();
}

(async () => {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("creating admin user!");
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(32).toString("hex");
    console.log("admin password:", password);
    await prisma.user.create({
      data: {
        user: "admin",
        pass: util.sha256(password),
        balance: 999_999_999_999_999n,
        transferToken: util.randomToken(),
        messages: `welcome, admin!`
      },
    });
  }
})();

export default globalThis.prisma;
