"use client";

import { FormEvent, useState } from "react";

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

export default function Home() {
  const [bannerText, setBannerText] = useState(
    "100% Sports welcome bonus up to 200 EUR. Rollover 6x. Min odds 1.6. 30 days. Casino bonus up to 300 EUR with cashback and rakeback.",
  );
  const [report, setReport] = useState<Report | null>(null);
  const [chatReply, setChatReply] = useState<string>("Ask AI to simulate your campaign and forecast FTD/NGR.");
  const [chatMessage, setChatMessage] = useState("Simulate this banner for 1000 personas");

  const runSimulation = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: "Sportsbook + Casino",
        audienceMarket: "Estonia",
        variantName: "Main variant",
        adMessage: bannerText,
        personas: 1000,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setReport(data);
    }
  };

  const askChat = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatMessage }),
    });

    const data = await response.json();
    setChatReply(data.reply || "No response");
    if (data.report) {
      setReport(data.report);
    }
  };

  return (
    <main>
      <h1>AI Audience Lab</h1>
      <p>Full-cycle AI workspace to test products, campaigns, and funnels before spending real ad budget.</p>

      <section className="panel">
        <h2>Campaign Simulation (1000 synthetic personas)</h2>
        <form onSubmit={runSimulation}>
          <label htmlFor="banner">Banner / Offer copy</label>
          <textarea id="banner" value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
          <div style={{ marginTop: "0.8rem" }}>
            <button type="submit">Run simulation</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Chat with AI</h2>
        <form onSubmit={askChat}>
          <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
          <div style={{ marginTop: "0.8rem" }}>
            <button type="submit">Ask AI</button>
          </div>
        </form>
        <p>{chatReply}</p>
      </section>

      {report ? (
        <section className="panel">
          <h2>Projected Funnel (Focus: FTD + NGR)</h2>
          <div className="grid">
            <div className="card">Impressions: {report.funnel.impressions}</div>
            <div className="card">Clicks: {report.funnel.clicks}</div>
            <div className="card">Signups: {report.funnel.signups}</div>
            <div className="card">FTD: {report.funnel.firstTimeDepositors}</div>
            <div className="card">NGR (€): {report.funnel.ngrEstimateEur}</div>
            <div className="card">CTR: {report.funnel.ctr}</div>
            <div className="card">Signup/Click: {report.funnel.signupRateFromClick}</div>
            <div className="card">FTD/Signup: {report.funnel.ftdRateFromSignup}</div>
          </div>

          <h3>Insights</h3>
          <ul>
            {report.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>

          <h3>Next actions</h3>
          <ul>
            {report.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
