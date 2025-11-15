"use client";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };
type Place = { placeId: string; name: string; rating?: number; vicinity?: string };

export default function Home() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);

  function send(text: string) {
    setMsgs((m) => [...m, { role: "user", text }]);
    const es = new EventSource(`/api/chat?msg=${encodeURIComponent(text)}`);
    let acc = "";
    es.onmessage = (e) => {
      acc += e.data;
      setMsgs((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") copy[copy.length - 1] = { role: "assistant", text: acc };
        else copy.push({ role: "assistant", text: acc });
        return copy;
      });
    };
    es.onerror = () => es.close();
  }

  async function findPlaces() {
    const r = await fetch(`/api/places?keyword=chinese&lat=37.7749&lng=-122.4194`);
    const j = await r.json();
    setPlaces(j.results || []);
  }

  async function confirmOrder() {
    if (!selected) return;
    const price = 8.79;
    const create = await fetch(`/api/checkout/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: selected.placeId, amountUsd: price, meta: { item: "Orange Chicken Bowl" } }),
    }).then((r) => r.json());

    if (!create.ok) {
      setMsgs((m) => [...m, { role: "assistant", text: `Payment denied: ${create.error}` }]);
      return;
    }

    const submit = await fetch(`/api/checkout/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locusAuthId: create.locusAuthId }),
    }).then((r) => r.json());

    setMsgs((m) => [
      ...m,
      { role: "assistant", text: submit.ok ? `Order placed! #${submit.orderId}` : "Order failed" },
    ]);
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Jarvis Web</h1>

      <div className="border rounded p-3 mb-4 h-80 overflow-auto bg-white">
        {msgs.map((m, i) => (
          <div key={i} className="mb-2">
            <span className="font-mono">{m.role === "user" ? "🧑" : "🤖"}</span>{" "}
            <span>{m.text}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={() => send("dude i'm hungry")}>
          Say: dude i&apos;m hungry
        </button>
        <button className="px-3 py-2 bg-gray-800 text-white rounded" onClick={findPlaces}>
          Find Chinese
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {places.map((p) => (
          <button
            key={p.placeId}
            onClick={() => setSelected(p)}
            className={`w-full text-left border rounded p-3 hover:bg-gray-50 ${
              selected?.placeId === p.placeId ? "border-blue-500" : ""
            }`}
          >
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-600">{p.vicinity}</div>
            <div className="text-sm">{p.rating ? `⭐ ${p.rating}` : ""}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="border rounded p-3 mb-4">
          <div className="mb-2">
            Confirm ordering from: <b>{selected.name}</b>
          </div>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={confirmOrder}>
            Confirm (Pay $8.79)
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to chat…"
          className="border rounded p-2 flex-1"
        />
        <button
          className="px-3 py-2 bg-black text-white rounded"
          onClick={() => {
            if (input) {
              send(input);
              setInput("");
            }
          }}
        >
          Send
        </button>
      </div>
    </main>
  );
}
