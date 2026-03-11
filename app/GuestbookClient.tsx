"use client";

import { useEffect, useState } from "react";
import { connect, request } from "@stacks/connect";

export default function GuestbookClient() {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleConnect() {
    try {
      setStatus("");
      await connect({
        forceWalletSelect: true,
      });
      setStatus("Wallet connected.");
    } catch (error) {
      console.error(error);
      setStatus("Connection failed or request rejected.");
    }
  }

  async function handleSendMessage() {
    try {
      setStatus("");

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contractName = process.env.NEXT_PUBLIC_CONTRACT_NAME;

      if (!contractAddress || !contractName) {
        setStatus("Missing contract environment variables.");
        return;
      }

      const result = await request("stx_callContract", {
        contract: `${contractAddress}.${contractName}`,
        functionName: "add-message",
        functionArgs: [message],
        network: "testnet",
      });

      console.log(result);
      setStatus("Transaction submitted.");
    } catch (error) {
      console.error(error);
      setStatus("Transaction failed.");
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p>Loading guestbook...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Stacks Guestbook</h1>

      <div className="flex gap-3 mb-4">
        <button onClick={handleConnect} className="border rounded px-4 py-2">
          Connect wallet
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message"
          className="border rounded px-3 py-2 w-full max-w-md"
        />
        <button onClick={handleSendMessage} className="border rounded px-4 py-2">
          Send
        </button>
      </div>

      {status && <p>{status}</p>}
    </main>
  );
}