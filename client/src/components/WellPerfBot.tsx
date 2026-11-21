"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, Terminal, ChevronRight, RotateCcw } from "lucide-react";
import { API_URL } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  engine?: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  "GL-06 quyusunda skin nə qədərdir və nə etməliyik?",
  "GL-04-dən GL-01-ə 100 Mscf/d qaz keçirsək nə qədər gəlir gələr?",
  "VFM modelinin dəqiqliyi (MAPE) və test separatoru tələsi nədir?",
  "PTA nəticələri: hansı quyular good, hansılar indicative-dir?",
  "14 İyun təbii qaz-lift eksperimentində nə baş verdi?",
  "GL-01 quyusu üzrə detallı hesabat ver",
];

function renderFormattedText(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyPrefix: string) => {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const body = tableRows.slice(1).filter((r) => !r.every((c) => /^[-:\s]+$/.test(c)));
    elements.push(
      <div key={keyPrefix} className="my-2 overflow-x-auto rounded border border-zinc-800">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-[#023F46] text-white">
              {header.map((h, i) => (
                <th key={i} className="px-2 py-1.5 text-left font-semibold border-b border-zinc-700">
                  {h.replace(/\*\*/g, "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="bg-zinc-950/80 hover:bg-zinc-900/60">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-2 py-1.5 text-zinc-200 font-mono">
                    {cell.replace(/\*\*/g, "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      return;
    } else if (tableRows.length > 0) {
      flushTable(`tbl_${idx}`);
    }

    if (!trimmed) {
      elements.push(<div key={idx} className="h-1.5" />);
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <div key={idx} className="font-bold text-xs text-teal-400 dark:text-teal-300 mt-1.5 mb-1">
          {trimmed.replace("### ", "")}
        </div>
      );
    } else if (trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div key={idx} className="pl-2 py-0.5 text-xs text-zinc-200 leading-relaxed flex gap-1.5">
          <span className="text-teal-400 shrink-0">•</span>
          <span
            dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(/^-\s|\d+\.\s/, "")
                .replace(/\*\*(.*?)\*\*/g, "<strong class='text-zinc-100 font-semibold'>$1</strong>")
                .replace(/`(.*?)`/g, "<code class='px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-teal-300'>$1</code>"),
            }}
          />
        </div>
      );
    } else {
      elements.push(
        <p
          key={idx}
          className="text-xs text-zinc-200 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: trimmed
              .replace(/\*\*(.*?)\*\*/g, "<strong class='text-zinc-100 font-semibold'>$1</strong>")
              .replace(/`(.*?)`/g, "<code class='px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-teal-300'>$1</code>"),
          }}
        />
      );
    }
  });

  if (tableRows.length > 0) {
    flushTable("tbl_end");
  }

  return elements;
}

export function WellPerfBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "### 🛢️ Salam! Mən WellPerf AI Mühəndis Botuyam\n**SOCAR (`projects/927485265746`)** üzrə 10 qaz-lift quyusunun (3.93M sensor sətri, VFM, PTA və Lift-Qaz Optimiser) canlı datasına qoşulmuşam.\n- İstənilən quyu (`GL-01`..`GL-10`), **VFM dəqiqliyi (3.72%)**, **PTA skin (`GL-06 +1.74`)** və ya **GL-04 → GL-01 qaz bölgüsü (+$485k/il)** barədə sual verə bilərsiniz!",
      engine: "socar · projects/927485265746",
      timestamp: "Canlı",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendQuestion = async (qText?: string) => {
    const query = (qText ?? input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!qText) setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/bot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: data.answer || "Cavab alına bilmədi.",
          engine: data.engine || "socar · projects/927485265746",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Serverlə əlaqə zamanı xəta baş verdi. Express serverin (port 5000) açıq olduğundan əmin olun.",
          engine: "Local Fallback",
          timestamp: "İndi",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (Bottom-Left or Bottom-Right above Agentation) */}
      <div className="fixed bottom-5 left-5 z-50">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group flex items-center gap-2.5 rounded-full bg-[#023F46] hover:bg-[#03535C] text-white px-4 py-2.5 shadow-2xl border border-teal-400/40 transition-all hover:scale-[1.02]"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-4 h-4 text-teal-300" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-none flex items-center gap-1.5">
                <span>WellPerf AI Bot</span>
                <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono text-teal-300 border border-teal-500/30">
                  socar
                </span>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Chat Drawer / Window */}
      {open && (
        <div className="fixed bottom-5 left-5 z-50 w-[370px] sm:w-[430px] max-h-[82vh] flex flex-col rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
          {/* Top Petrol Header */}
          <div className="bg-[#023F46] text-white px-4 py-3 flex items-center justify-between border-b border-teal-500/30">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-black/25 border border-teal-400/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                  <span>WellPerf Engineering Copilot</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] font-mono text-teal-200/90 flex items-center gap-1">
                  <Terminal className="w-2.5 h-2.5" />
                  <span>key: socar · projects/927485265746</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Söhbəti sıfırla"
                onClick={() => setMessages((prev) => [prev[0]])}
                className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-black/20 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Bağla"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-black/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-zinc-900/70 border-b border-zinc-800">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Hazır Mühəndis Sorğuları (1-Kliklə Test Et):</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950 hover:border-teal-500/50 hover:bg-[#023F46] hover:text-white px-2 py-1 text-[11px] text-zinc-300 transition"
                >
                  <ChevronRight className="w-2.5 h-2.5 text-teal-400" />
                  <span className="max-w-[190px] truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[270px] max-h-[420px] bg-zinc-950"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 ${
                    m.role === "user"
                      ? "bg-[#023F46] text-white border border-teal-500/30"
                      : "bg-zinc-900/90 text-zinc-100 border border-zinc-800"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="text-xs font-medium">{m.content}</div>
                  ) : (
                    <div className="space-y-1">{renderFormattedText(m.content)}</div>
                  )}
                </div>
                <div className="mt-1 px-1 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                  <span>{m.timestamp}</span>
                  {m.engine && <span>· {m.engine}</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs font-mono text-teal-400 px-2 py-1">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                <span>Yataq telemetriyası və PTA/VFM modelləri analiz edilir...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion();
            }}
            className="p-2.5 border-t border-zinc-800 bg-zinc-900/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Quyu (GL-06), VFM, PTA və ya Qaz-lift barədə soruş..."
              className="flex-1 h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-9 px-3.5 rounded-lg bg-[#023F46] hover:bg-[#03535C] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 border border-teal-400/30 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Göndər</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
