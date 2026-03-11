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
      console.error(error);
      setStatus("Connection failed.");
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
        setStatus("Missing contract variables.");
        return;
      }

      const trimmed = message.trim();

      if (!trimmed) {
        setStatus("Enter a message.");
        return;
      }

      const stacksConnect = await import("@stacks/connect");
      const { request } = stacksConnect;

      const result = await request("stx_callContract", {
        contract: `${contractAddress}.${contractName}`,
        functionName: "add-message",
        functionArgs: [stringAsciiCV(trimmed)],
        network: "mainnet",
      });

      console.log(result);

      setStatus("Transaction submitted.");
      setMessage("");
    } catch (error) {
      console.error(error);
      setStatus("Transaction failed.");
    } finally {
      setIsBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-orange-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">

      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">

        <h1 className="text-3xl font-bold mb-2 text-orange-400">
          Stacks Guestbook
        </h1>

        <p className="text-zinc-400 mb-6">
          Leave a message on the Stacks blockchain
        </p>

        <button
          onClick={handleConnect}
          disabled={isBusy}
          className="mb-6 w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold py-3 rounded-lg transition"
        >
          Connect Wallet
        </button>

        <div className="flex gap-3 mb-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            maxLength={280}
            disabled={isBusy}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
          />

          <button
            onClick={handleSendMessage}
            disabled={isBusy}
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-5 rounded-lg transition"
          >
            Send
          </button>
        </div>

        {status && (
          <div className="mt-4 text-sm text-orange-400">
            {status}
          </div>
        )}

      </div>
    </div>
  );
}