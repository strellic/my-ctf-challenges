import { zfd } from "zod-form-data";
import { fromError } from "zod-validation-error";
import { redirect } from "next/navigation";

import db from "@/db";

import PostsList from "@/components/PostsList";

const schema = zfd.formData({
  user: zfd.text(),
});

async function view(formData: FormData) {
  "use server";

  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return redirect("/admin?message=" + fromError(parsed.error).toString());
  }

  const posts = await db.post.findMany({
    where: {
      author: {
        user: parsed.data.user,
      },
    },
  });
  return posts;
}

export default async function AdminView({
  params,
}: {
  params: { user: string };
}) {
  const data = new FormData();
  data.set("user", params.user);
  const posts = await view(data);

  return (
    <main>
      <h3>admin</h3>
      <h5>posts for {params.user}:</h5>
      <hr />
      <PostsList posts={posts} />
    </main>
  );
}
