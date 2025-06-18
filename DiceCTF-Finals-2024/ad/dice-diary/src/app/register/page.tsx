import { fromError } from "zod-validation-error";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { zfd } from "zod-form-data";
import { z } from "zod";

import util from "@/util";
import db from "@/db";

const schema = zfd.formData({
  user: zfd.text(z.string().min(5).max(64)),
  pass: zfd.text(z.string().min(7)),
});

async function register(formData: FormData) {
  "use server";
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return redirect("/register?message=" + fromError(parsed.error).toString());
  }

  if (parsed.data.pass.includes(parsed.data.user)) {
    return redirect("/register?message=Please choose a better password...");
  }

  const user = await db.user.create({
    data: {
      id: util.generateId("u-"),
      user: parsed.data.user,
      pass: util.sha256(parsed.data.pass),
    },
  });
  cookies().set("session", util.encrypt(user.id));
  redirect("/home");
}

export default function Home() {
  return (
    <main>
      <h3>register</h3>
      <hr />
      <form action={register} className="flex flex-col space-y-4">
        <input type="text" name="user" placeholder="username" />
        <input type="password" name="pass" placeholder="password" />
        <input type="submit" className="flex-[0]" value="register" />
      </form>
    </main>
  );
}
