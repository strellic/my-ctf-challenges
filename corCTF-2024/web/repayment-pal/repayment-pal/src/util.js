import { getCookie } from 'cookies-next';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// make sure this only runs once
if (!globalThis.SECRET_KEY) {
  globalThis.SECRET_KEY = process.env.SECRET_KEY || crypto.randomBytes(64).toString("hex");
}

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const randomToken = (n = 8) => crypto.randomBytes(n).toString("base64url");

const jwtEncode = (data) => jwt.sign(data, globalThis.SECRET_KEY, { algorithm: "HS256" });
const jwtDecode = (data) => jwt.verify(data, globalThis.SECRET_KEY, { algortihm: "HS256" });

const getSession = (req, res) => {
  const session = getCookie("session", { req, res });
  if (!session) {
    return null;
  }

  let jwt;
  try {
    jwt = jwtDecode(session);
  } catch {
    return null;
  }

  return jwt;
};

export default {
  sha256,
  randomToken,
  jwtEncode,
  jwtDecode,
  getSession
}