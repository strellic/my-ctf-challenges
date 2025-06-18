"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h4>Error</h4>
      <hr />
      <p>{error.message}</p>
    </main>
  );
}
