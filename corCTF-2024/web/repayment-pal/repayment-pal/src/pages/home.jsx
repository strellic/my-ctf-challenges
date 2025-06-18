import { useRouter } from 'next/router';
import Link from 'next/link';
import React from 'react';

export default function Login() {
  const [balance, setBalance] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [transferToken, setTransferToken] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      const r = await fetch('/api/user/balance');
      if (!r.ok) {
        router.push("/");
        return;
      }
      setBalance(await r.text());
    })();
    (async () => {
      const r = await fetch('/api/user/messages');
      if (!r.ok) {
        router.push("/");
        return;
      }
      setMessages((await r.text()).split("\n"));
    })();
  }, []);

  const revealToken = async () => {
    if (!confirm("are you sure you want to do this?\nmake sure no one else gets a hold of your transfer token!")) {
      return;
    }

    (async () => {
      const r = await fetch('/api/user/token');
      if (!r.ok) {
        router.push("/");
        return;
      }
      setTransferToken(await r.text());
    })();
  };

  const getFlag = async () => {
    (async () => {
      const r = await fetch('/api/user/flag');
      if (!r.ok) {
        alert(await r.text());
        return;
      }
      prompt("nice", await r.text());
      router.push("/");
    })();
  };

  return (
    <div>
      <h5 className="mt-4">your balance: ${balance}</h5>
      <h5>transfer money:</h5>
      { transferToken && (
        <h6>transfer token: {transferToken}</h6>
      ) }
      <Link href="/transfer">
        <button className="btn btn-primary">transfer</button>
      </Link>
      <hr />
      <h5>reveal transfer token:</h5>
      <button className="btn btn-danger" onClick={revealToken}>reveal</button>
      <hr />
      <h5>get flag:</h5>
      <button className="btn btn-success" onClick={getFlag}>flag</button>
      <hr />
      <h5>messages:</h5>
      <ul>
        { messages.reverse().map((msg, i) => (
          <li key={i}>{msg}</li>
        )) }
      </ul>
    </div>
  );
}