import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deliverant",
  description: "Webhook reliability dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${googleSans.className} ${googleSans.variable} ${googleSansCode.variable} antialiased`}>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#222228",
              border: "1px solid #26262c",
              color: "#ededef",
            },
          }}
        />
      </body>
    </html>
  );
}
