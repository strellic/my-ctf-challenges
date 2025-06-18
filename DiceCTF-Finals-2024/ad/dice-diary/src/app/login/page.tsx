import { fromError } from "zod-validation-error";
import { cookies } from "next/headers";
import { zfd } from "zod-form-data";
import { z } from "zod";

import util from "@/util";
import db from "@/db";
import { redirect } from "next/navigation";

const schema = zfd.formData({
  user: zfd.text(z.string().min(5).max(64)),
  pass: zfd.text(z.string().min(7)),
});

async function login(formData: FormData) {
  "use server";
  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return redirect("/login?message=" + fromError(parsed.error).toString());
  }

  const user = await db.user.findFirst({
    where: { user: parsed.data.user, pass: util.sha256(parsed.data.pass) },
  });

  if (!user) {
    redirect("/login?message=no user was found with that username or password");
  }

  cookies().set("session", util.encrypt(user.id));
  redirect("/home");
}

export default function Home() {
  return (
    <main>
      <h3>login</h3>
      <hr />
      <form action={login} className="flex flex-col space-y-4">
        <input type="text" name="user" placeholder="username" />
        <input type="password" name="pass" placeholder="password" />
        <input type="submit" className="flex-[0]" value="login" />
      </form>
    </main>
  );
}
