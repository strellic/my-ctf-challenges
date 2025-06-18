import { fromError } from "zod-validation-error";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";
import { z } from "zod";

import util from "@/util";
import db from "@/db";

import PostsList from "@/components/PostsList";

const schema = zfd.formData({
  title: zfd.text(z.string().min(1).max(64)),
  content: zfd.text(z.string().min(1).max(512)),
  secret: zfd.checkbox(),
});

async function create(formData: FormData) {
  "use server";
  const user = await util.getUser();
  if (!user) {
    return redirect("/login?message=please login first");
  }

  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return redirect("/home?message=" + fromError(parsed.error).toString());
  }

  const id = util.generateId("p-");
  const post = await db.post.create({
    data: {
      id,
      title: parsed.data.title,
      secret: parsed.data.secret,
      authorId: user.id,
    },
  });

  await db.postEntry.create({
    data: {
      id,
      content: parsed.data.content,
    },
  });

  redirect(`/post/${post.id}`);
}

async function view(formData: FormData) {
  "use server";
  const user = formData.get("user");
  redirect(`/view/${user}`);
}

export default async function Home() {
  const user = await util.getUserWithPosts();
  if (!user) return <></>;

  return (
    <main>
      <h3>home</h3>
      <hr />
      <h4>
        welcome, {user.user} ({user.id})!
      </h4>
      <PostsList posts={user.posts} />
      <hr />
      <h5>create a new post:</h5>
      <form action={create} className="flex flex-col space-y-4">
        <input type="text" name="title" placeholder="title" />
        <textarea
          name="content"
          placeholder="content"
          className="resize-y"
        ></textarea>
        <label htmlFor="secret">
          <input
            type="checkbox"
            name="secret"
            id="secret"
            defaultChecked={true}
          />
          {" secret"}
        </label>
        <input type="submit" className="flex-[0]" value="create" />
      </form>
      <hr />
      <h5>search your posts:</h5>
      <form action="/search" className="flex flex-col space-y-4">
        <input type="text" name="query" placeholder="query" />
        <input type="submit" className="flex-[0]" value="search" />
      </form>
      <h5>view another user:</h5>
      <form action={view} className="flex flex-col space-y-4">
        <input type="text" name="user" placeholder="user" />
        <input type="submit" className="flex-[0]" value="view" />
      </form>
    </main>
  );
}
