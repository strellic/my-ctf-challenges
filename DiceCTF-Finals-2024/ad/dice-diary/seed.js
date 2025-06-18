const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
require("dotenv").config();

const prisma = new PrismaClient();
(async () => {
  const admin = await prisma.user.findFirst({ where: { id: "admin" }});
  if (admin) { 
    return;
  }

  console.log("creating admin user!");

  // IMPORTANT NOTE: do NOT change this or you will fail SLA!
  // this will be different for each team
  // SLA will use the admin functionality on the website, and needs this password to log in
  let adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.log("ADMIN_PASSWORD is empty, setting it to a random string...");
    adminPassword = crypto.randomBytes(16).toString("hex");
  }
  console.log("ADMIN_PASSWORD is set to", adminPassword);

  await prisma.user.create({
    data: {
      id: "admin",
      user: "admin",
      pass: crypto.createHash("sha256").update(adminPassword).digest("hex"),
    },
  });
})();