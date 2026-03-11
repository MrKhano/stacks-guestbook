"use client";

import { useEffect, useMemo, useState } from "react";
import { connect, request } from "@stacks/connect";
import { Cl, cvToHex, cvToValue, hexToCV } from "@stacks/transactions";

type GuestbookMessage = {
  id: number;
  sender: string;
  text: string;
};

type TxResultLike = {
  txid?: string;
  txId?: string;
  transactionId?: string;
};

export default function GuestbookClient() {
  const [contractAddress, setContractAddress] = useState(
    "SP331YXD9ZA5V9VS4P3XTQ5DAFA9G6VQ7FV95ZRXY"
  );
  const [contractName, setContractName] = useState("guestbook");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [txLink, setTxLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnectedWallet, setIsConnectedWallet] = useState(false);

  const contractId = useMemo(
    () =>
      `${contractAddress.trim()}.${contractName.trim()}` as `${string}.${string}`,
    [contractAddress, contractName]
  );

  async function handleConnect() {
    try {
      setStatus("");
      setTxLink("");
      setIsLoading(true);

      await connect({
        forceWalletSelect: true,
        network: "mainnet",
      });

      setIsConnectedWallet(true);
      setStatus("Wallet connected. You can now send a message.");
    } catch (error: any) {
      console.error("CONNECT ERROR:", error);
      setStatus(error?.message || "Connection failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMessages() {
    try {
      if (!contractAddress.trim() || !contractName.trim()) return;

      setIsLoadingMessages(true);

      const countResponse = await fetch(
        `https://api.hiro.so/v2/contracts/call-read/${contractAddress.trim()}/${contractName.trim()}/get-message-count`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: contractAddress.trim(),
            arguments: [],
          }),
        }
      );

      const countData = await countResponse.json();

      if (!countData?.okay || !countData?.result) {
        setMessages([]);
        return;
      }

      const countCV = hexToCV(countData.result);
      const countValue = Number(cvToValue(countCV).value ?? 0);

      if (!countValue || countValue < 1) {
        setMessages([]);
        return;
      }

      const loadedMessages: GuestbookMessage[] = [];

      for (let i = countValue; i >= 1; i--) {
        const msgResponse = await fetch(
          `https://api.hiro.so/v2/contracts/call-read/${contractAddress.trim()}/${contractName.trim()}/get-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: contractAddress.trim(),
              arguments: [cvToHex(Cl.uint(i))],
            }),
          }
        );

        const msgData = await msgResponse.json();

        if (!msgData?.okay || !msgData?.result) continue;

        const msgCV = hexToCV(msgData.result);
        const msgValue: any = cvToValue(msgCV);

        if (msgValue?.type === "(optional none)") continue;

        const value = msgValue?.value;

        if (value) {
          loadedMessages.push({
            id: i,
            sender: value.sender?.value ?? "",
            text: value.text?.value ?? "",
          });
        }
      }

      setMessages(loadedMessages);
    } catch (error) {
      console.error("LOAD MESSAGES ERROR:", error);
      setStatus("Failed to load messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleSendMessage() {
    try {
      setStatus("");
      setTxLink("");

      if (!contractAddress.trim()) {
        setStatus("Please enter a contract address.");
        return;
      }

      if (!contractName.trim()) {
        setStatus("Please enter a contract name.");
        return;
      }

      if (!message.trim()) {
        setStatus("Please enter a message.");
        return;
      }

      if (message.trim().length > 280) {
        setStatus("Message must be 280 characters or less.");
        return;
      }

      setIsLoading(true);

      const result = (await request("stx_callContract", {
        contract: contractId,
        functionName: "add-message",
        functionArgs: [Cl.stringAscii(message.trim())],
        network: "mainnet",
      })) as TxResultLike;

      const txid = result?.txid || result?.txId || result?.transactionId || "";

      if (txid) {
        setStatus("Transaction submitted successfully.");
        setTxLink(`https://explorer.hiro.so/txid/${txid}?chain=mainnet`);
      } else {
        setStatus("Transaction submitted successfully.");
      }

      setMessage("");

      setTimeout(() => {
        loadMessages();
      }, 4000);
    } catch (error: any) {
      console.error("SEND ERROR:", error);

      if (error?.message === "User rejected request") {
        setStatus("Transaction rejected in Leather.");
      } else {
        setStatus(error?.message || "Transaction failed.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-100 text-neutral-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-orange-200 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-orange-600">
                Stacks Guestbook
              </h1>
              <p className="mt-3 text-base text-neutral-600">
                Connect your wallet and publish a message to your Stacks mainnet
                guestbook contract.
              </p>
            </div>

            <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
              {isConnectedWallet ? "Wallet connected" : "Mainnet"}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-orange-600">
              Write a message
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Contract address
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                  placeholder="SP..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Contract name
                </label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                  placeholder="guestbook"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={280}
                  placeholder="Write your message here..."
                  className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  {message.length}/280 characters
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Please wait..." : "Connect wallet"}
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                  className="rounded-2xl border border-orange-300 bg-orange-100 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Submitting..." : "Send message"}
                </button>

                <button
                  onClick={loadMessages}
                  disabled={isLoadingMessages}
                  className="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingMessages ? "Refreshing..." : "Refresh messages"}
                </button>
              </div>

              {status && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="break-all text-sm text-neutral-700">{status}</p>
                  {txLink && (
                    <a
                      href={txLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-orange-600 underline"
                    >
                      View transaction on Hiro Explorer
                    </a>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Current contract
                </p>
                <p className="mt-2 break-all text-sm text-neutral-700">
                  {contractId}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-orange-600">
                Guestbook messages
              </h2>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                {messages.length} shown
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {isLoadingMessages ? (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-neutral-600">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-neutral-600">
                  No messages found yet.
                </div>
              ) : (
                messages.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-orange-200 bg-orange-50 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-orange-700">
                        Message #{item.id}
                      </p>
                    </div>

                    <p className="mt-3 text-base text-neutral-800">{item.text}</p>

                    <p className="mt-4 break-all text-xs text-neutral-500">
                      From: {item.sender}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}