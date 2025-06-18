import db from "@/db";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const post = await db.post.findFirst({
    where: { id },
    include: { author: true },
  });

  if (!post) {
    return (
      <main>
        <h4>404</h4>
        <hr />
        <h5>no post was found with that id!</h5>
      </main>
    );
  }

  const entry = await db.postEntry.findFirst({
    where: { id },
  });

  if (!entry) {
    return (
      <main>
        <h4>404</h4>
        <hr />
        <h5>no post data was found with that id!</h5>
      </main>
    );
  }

  return (
    <main>
      <h4>
        {post.title}
        {post.secret ? " (secret)" : ""}
      </h4>
      <hr />
      <div>{entry.content}</div>
      <h5>
        author: {post.author.user} ({post.author.id})
      </h5>
      <a href="/home">← Back</a>
    </main>
  );
}
