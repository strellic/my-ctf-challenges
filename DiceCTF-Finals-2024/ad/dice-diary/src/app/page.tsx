import Link from "next/link";

export default async function Home() {
  return (
    <main>
      <h1>dice-diary</h1>
      <hr />
      <Link href="/login">Login</Link>
      <br />
      <Link href="/register">Register</Link>
    </main>
  );
}
