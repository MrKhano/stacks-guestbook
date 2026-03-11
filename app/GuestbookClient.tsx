"use client";

import { useEffect, useState } from "react";
import { stringAsciiCV } from "@stacks/transactions";

export default function GuestbookClient() {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleConnect() {
    try {
      setIsBusy(true);
      setStatus("");

      const stacksConnect = await import("@stacks/connect");
      const { connect } = stacksConnect;

      await connect({
        forceWalletSelect: true,
      });

      setStatus("Wallet connected.");
    } catch (error) {
      console.error("Connect error:", error);
      setStatus("Connection failed or request rejected.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSendMessage() {
    try {
      setIsBusy(true);
      setStatus("");

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contractName = process.env.NEXT_PUBLIC_CONTRACT_NAME;

      if (!contractAddress || !contractName) {
        setStatus("Missing contract environment variables.");
        return;
      }

      if (!message.trim()) {
        setStatus("Please enter a message.");
        return;
      }

      const stacksConnect = await import("@stacks/connect");
      const { request } = stacksConnect;

      const result = await request("stx_callContract", {
        contract: `${contractAddress}.${contractName}`,
        functionName: "add-message",
        functionArgs: [stringAsciiCV(message.trim())]
        network: "mainnet",
      });

      console.log("Transaction result:", result);
      setStatus("Transaction submitted.");
      setMessage("");
    } catch (error) {
      console.error("Transaction error:", error);
      setStatus("Transaction failed.");
    } finally {
      setIsBusy(false);
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
        <button
          onClick={handleConnect}
          disabled={isBusy}
          className="border rounded px-4 py-2 disabled:opacity-50"
        >
          {isBusy ? "Please wait..." : "Connect wallet"}
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message"
          className="border rounded px-3 py-2 w-full max-w-md"
          disabled={isBusy}
        />
        <button
          onClick={handleSendMessage}
          disabled={isBusy}
          className="border rounded px-4 py-2 disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {status && <p>{status}</p>}
    </main>
  );
}