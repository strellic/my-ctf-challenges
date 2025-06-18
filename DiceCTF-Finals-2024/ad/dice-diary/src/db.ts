import { PrismaClient } from "@prisma/client";

// only initialize one db
if (!(globalThis as any).prisma) {
  (globalThis as any).prisma = new PrismaClient();
}
export default (globalThis as any).prisma;
