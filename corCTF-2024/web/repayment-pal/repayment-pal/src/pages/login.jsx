import { useRouter } from 'next/router';
import Link from 'next/link';
import React from 'react';

export default function Login() {
  const [user, setUser] = React.useState("");
  const [pass, setPass] = React.useState("");
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user, pass })
      });
      if (!r.ok) {
        alert(await r.text());
        return;
      }
      router.push("/home");
    } catch {}
  };

  return (
    <div>
      <h3 className="mb-3">Login</h3>
      <form className="d-flex" onSubmit={onSubmit}>
        <fieldset>
        <p>
          <input className="form-control me-sm-2" placeholder="Username" value={user} onChange={e => setUser(e.target.value)} />
        </p>
        <p>
          <input className="form-control me-sm-2" placeholder="Password" value={pass} type="password" onChange={e => setPass(e.target.value)} />
        </p>
        <p>
          <button className="btn btn-primary my-2 my-sm-0" type="submit">Login</button>
        </p>
        </fieldset>
      </form>
      <Link href="/">← Back</Link>
    </div>
  );
}