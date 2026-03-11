"use client";

import dynamic from "next/dynamic";

const GuestbookClient = dynamic(() => import("./GuestbookClient"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p>Loading guestbook...</p>
    </main>
  ),
});

export default function GuestbookShell() {
  return <GuestbookClient />;
}