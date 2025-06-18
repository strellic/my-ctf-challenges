import db from "@/db";

import PostsList from "@/components/PostsList";

export default async function Page({ params }: { params: { user: string } }) {
  const user = await db.user.findFirst({
    where: { user: params.user },
    include: { posts: true },
  });

  if (!user) {
    return (
      <main>
        <h4>404</h4>
        <hr />
        <h5>no user was found with that username!</h5>
      </main>
    );
  }

  return (
    <main>
      <h4>
        {user.user}&apos;s page ({user.id})
      </h4>
      <hr />
      <PostsList secret={false} posts={user.posts} />
    </main>
  );
}
