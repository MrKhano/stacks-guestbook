import dynamic from "next/dynamic";

const GuestbookClient = dynamic(() => import("./GuestbookClient"), {
  ssr: false,
});

export default function Page() {
  return <GuestbookClient />;
}