import { useSearchParams } from 'next/navigation';
import { useForm } from "react-hook-form";
import { useRouter } from 'next/router';
import Link from 'next/link';
import React from 'react';

export default function Transfer() {
  const { register, setValue, watch, getValues } = useForm();
  const [recipient, message, value] = [watch("recipient"), watch("message"), watch("value")];
  const [loading, setLoading] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const onSubmit = async () => {
    const { recipient, message, value, transferToken } = getValues();
    setLoading(true);
    try {
      const r = await fetch("/api/user/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipient, message, transferToken, value })
      });
      alert(await r.text());
      router.push("/home");
    } catch {}
  }

  React.useEffect(() => {
    searchParams.entries().forEach(([k,v]) => setValue(k, v));
    if (searchParams.get("autosubmit")) {
      onSubmit();
    }
  }, [searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams();
    recipient && params.set("recipient", recipient);
    message && params.set("message", message);
    value && params.set("value", value);
    if (recipient || message || value) {
      history.replaceState(null, null, `/transfer?${params.toString()}`);
    }
  }, [recipient, message, value]);

  return loading ? <div></div> : (
    <div>
      <h5>transfer money:</h5>
      <form onSubmit={onSubmit}>
        <fieldset>
          <p>
            <input className="form-control me-sm-2" placeholder="recipient" {...register("recipient")} />
          </p>
          <p>
            <input type="number" className="form-control me-sm-2" placeholder="value ($)" {...register("value")} />
          </p>
          <p>
            <input className="form-control me-sm-2" placeholder="message" {...register("message")} />
          </p>
          <p>
            <input className="form-control me-sm-2" placeholder="transfer token" type="password" {...register("transferToken")} />
          </p>
          <p>
            <input className="btn btn-primary my-2 my-sm-0" type="submit" />
          </p>
        </fieldset>
      </form>
      <Link href="/home">← Back</Link>
    </div>
  );
}