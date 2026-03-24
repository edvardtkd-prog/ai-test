"use client";

import { FormEvent, useMemo, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

type Report = {
  funnel: {
    impressions: number;
    clicks: number;
    signups: number;
    firstTimeDepositors: number;
    ngrEstimateEur: number;
    ctr: number;
    signupRateFromClick: number;
    ftdRateFromSignup: number;
  };
  insights: string[];
  nextActions: string[];
};

const defaultBanner =
  "100% Sports welcome bonus up to 200 EUR. Rollover 6x. Min odds 1.6. 30 days. Casino bonus up to 300 EUR with cashback and rakeback.";

export default function Home() {
  const [bannerText, setBannerText] = useState(defaultBanner);
  const [report, setReport] = useState<Report | null>(null);
  const [chatInput, setChatInput] = useState("Run a simulation and tell me how to improve FTD and NGR");
  const [isSimLoading, setIsSimLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey — I can run simulations, forecast FTD/NGR, and suggest exact funnel changes. Ask me anything about your campaign.",
    },
  ]);

  const modelStatus = useMemo(() => {
    if (!messages.length) return "Unknown";
    const hasFallback = messages.some((m) => m.content.includes("fallback"));
    return hasFallback ? "Fallback mode" : "Live mode";
  }, [messages]);

  const runSimulation = async (e: FormEvent) => {
    e.preventDefault();
    setIsSimLoading(true);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Sportsbook + Casino",
          audienceMarket: "Estonia",
          variantName: "Primary creative",
          adMessage: bannerText,
          personas: 1000,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setReport(data);
      }
    } finally {
      setIsSimLoading(false);
    }
  };

  const askLiveChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          bannerText,
        }),
      });

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          response.ok && data.reply
            ? data.reply
            : `Chat API error: ${data.details ?? "unknown"}. Please try again.`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (data.report) setReport(data.report as Report);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="badge">AI Audience Lab</p>
          <h1>Live AI Campaign Copilot</h1>
          <p>
            Stress-test ads, funnels, and onboarding before you spend real money. Focused on what matters most: <b>FTD</b>
            and <b> NGR</b>.
          </p>
        </div>
        <div className="heroCard">
          <p className="muted">Chat engine status</p>
          <p className="status">{modelStatus}</p>
          <p className="muted">Enable real model replies by setting <code>OPENAI_API_KEY</code> in your server env.</p>
        </div>
      </header>

      <section className="layoutGrid">
        <article className="glass">
          <h2>Simulation Input</h2>
          <form onSubmit={runSimulation}>
            <label htmlFor="banner">Banner / Offer Copy</label>
            <textarea id="banner" value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
            <button type="submit" disabled={isSimLoading}>{isSimLoading ? "Simulating..." : "Run 1000-person simulation"}</button>
          </form>
        </article>

        <article className="glass">
          <h2>Live Chat</h2>
          <div className="chatWindow">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`bubble ${msg.role === "assistant" ? "assistant" : "user"}`}>
                {msg.content}
              </div>
            ))}
            {isChatLoading ? <div className="bubble assistant">Thinking...</div> : null}
          </div>

          <form onSubmit={askLiveChat} className="chatForm">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for recommendations, simulations, or funnel fixes..."
            />
            <button type="submit" disabled={isChatLoading}>{isChatLoading ? "Sending..." : "Send"}</button>
          </form>
        </article>
      </section>

      {report ? (
        <section className="glass report">
          <h2>Projected Funnel</h2>
          <div className="metricGrid">
            <div className="metric"><span>Impressions</span><strong>{report.funnel.impressions}</strong></div>
            <div className="metric"><span>Clicks</span><strong>{report.funnel.clicks}</strong></div>
            <div className="metric"><span>Signups</span><strong>{report.funnel.signups}</strong></div>
            <div className="metric"><span>FTD</span><strong>{report.funnel.firstTimeDepositors}</strong></div>
            <div className="metric"><span>NGR (€)</span><strong>{report.funnel.ngrEstimateEur}</strong></div>
            <div className="metric"><span>CTR</span><strong>{report.funnel.ctr}</strong></div>
            <div className="metric"><span>Signup / Click</span><strong>{report.funnel.signupRateFromClick}</strong></div>
            <div className="metric"><span>FTD / Signup</span><strong>{report.funnel.ftdRateFromSignup}</strong></div>
          </div>

          <div className="twocol">
            <div>
              <h3>Insights</h3>
              <ul>
                {report.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Next actions</h3>
              <ul>
                {report.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
