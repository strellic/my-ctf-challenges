import Link from "next/link";
import { redirect } from "next/navigation";

import db from "@/db";

import PostsList from "@/components/PostsList";

async function view(formData: FormData) {
  "use server";
  const user = formData.get("user");
  redirect(`/admin/view/${user}`);
}

export default async function Admin() {
  const posts = await db.post.findMany();

  return (
    <main>
      <h3>admin</h3>
      <hr />
      <h4>welcome, admin!</h4>
      <hr />
      <h5>all posts:</h5>
      <PostsList posts={posts} />
      <hr />
      <h5>view posts from specific user</h5>
      <form action={view} className="flex flex-col space-y-4">
        <input type="text" name="user" placeholder="user" />
        <input type="submit" className="flex-[0]" value="view" />
      </form>
    </main>
  );
}
