import { redirect } from "next/navigation";
import { Post } from "@prisma/client";

import util from "@/util";
import db from "@/db";

import PostsList from "@/components/PostsList";

export default async function Search({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const { query } = searchParams;
  if (!query) {
    return redirect("/home?message=missing search query");
  }

  const user = await util.getUser();
  const re = new RegExp(query, "i");
  const posts = (
    await db.post.findMany({ where: { authorId: user?.id } })
  ).filter((p: Post) => re.test(JSON.stringify(p)));

  if (posts.length === 0) {
    return redirect("/home?message=no posts found");
  }

  return (
    <main>
      <h4>you searched for: {query}</h4>
      <hr />
      <PostsList posts={posts} />
    </main>
  );
}
