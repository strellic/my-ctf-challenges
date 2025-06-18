import Link from 'next/link';

export default function Index() {
  return (
    <div>
      <Link href="/login">
        <button className="btn btn-primary me-2">Login</button>
      </Link>
      <Link href="/register">
        <button className="btn btn-danger">Register</button>
      </Link>
    </div>
  );
}