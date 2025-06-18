"use client";

import { Post } from "@prisma/client";
import Link from "next/link";

export default function PostsList({
  posts,
  secret = true,
}: {
  posts: Post[];
  secret?: boolean;
}) {
  return posts.length === 0 ? (
    <h5>no posts found!</h5>
  ) : (
    <ol>
      {posts
        .filter((p) => secret || !p.secret)
        .map((p) => (
          <li key={p.id}>
            <Link href={`/post/${p.id}`}>{p.title}</Link>
          </li>
        ))}
    </ol>
  );
}
