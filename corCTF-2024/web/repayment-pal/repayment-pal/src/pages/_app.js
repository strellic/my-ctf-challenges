export default function App({ Component, pageProps }) {
  return (
    <div className="container mt-5">
      <div>
        <h2>repayment-pal</h2>
        <p>pay off your debt here!!!!!!!</p>
      </div>
      <hr />
      <Component {...pageProps} />
    </div>
  );
}
