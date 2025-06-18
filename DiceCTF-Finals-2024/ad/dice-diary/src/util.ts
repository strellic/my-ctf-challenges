import { cookies } from "next/headers";
import { Prisma, User } from "@prisma/client";
import crypto from "crypto";

import db from "@/db";

const sha256 = (data: string) =>
  crypto.createHash("sha256").update(data).digest("hex");

const SECRET_KEY = process.env.SECRET_KEY || "SECRETSECRETSECRETSECRETSECRETSE";

const encrypt = (data: string) => {
  const iv = Buffer.from(crypto.randomBytes(16));
  const cipher = crypto.createCipheriv("aes-256-gcm", SECRET_KEY, iv);
  const enc = cipher.update(data, "utf-8", "base64") + cipher.final("base64");
  return [
    enc,
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
  ].join(".");
};

const decrypt = (data: string) => {
  const [enc, iv, authTag] = data
    .split(".")
    .map((d) => Buffer.from(d, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  const dec = decipher.update(enc, undefined, "utf8");
  return dec;
};

const getUser = async (): Promise<User | null> => {
  const session = cookies().get("session");
  if (session) {
    try {
      const id = decrypt(session.value);
      return await db.user.findFirst({
        where: { id },
      });
    } catch {}
  }
  return null;
};

type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true };
}>;
const getUserWithPosts = async (): Promise<UserWithPosts | null> => {
  const session = cookies().get("session");
  if (session) {
    try {
      const id = decrypt(session.value);
      return await db.user.findFirst({
        where: { id },
        include: { posts: true },
      });
    } catch {}
  }
  return null;
};

const generateId = (prefix: string, length = 8): string => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % characters.length;
    result += characters.charAt(randomIndex);
  }

  return prefix + result;
};

const util = {
  sha256,
  encrypt,
  decrypt,
  getUser,
  getUserWithPosts,
  generateId,
};

export default util;
