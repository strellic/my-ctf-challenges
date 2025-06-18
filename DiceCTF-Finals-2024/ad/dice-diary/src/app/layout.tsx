import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";
import "../../node_modules/axist/dist/axist.min.css";

export const metadata: Metadata = {
  title: "dice-diary",
  description: "dice-diary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Script id="alert-message" strategy="afterInteractive">
        {`
          setInterval(() => {
            const params = new URLSearchParams(location.search);
            if (params.has("message")) {
              history.replaceState(history.state, null, location.pathname);
              alert(params.get("message"));
            }
          }, 1000);
        `}
      </Script>
    </html>
  );
}
