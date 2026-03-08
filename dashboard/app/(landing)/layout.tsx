import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deliverant — Reliable webhook delivery under failure",
  description:
    "A hosted reliability layer for outbound webhooks. At-least-once delivery, enforced deduplication, deterministic retries, and full delivery visibility.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
