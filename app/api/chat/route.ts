import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runSimulation } from "@/lib/simulation";

const chatSchema = z.object({
  message: z.string().min(2),
});

const demoBanner = `
100% Sports welcome bonus up to 200 EUR.
Rollover 6x, min odds 1.6, valid 30 days.
Casino extra value up to 300 EUR with cashback and rakeback.
`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = parsed.data.message.toLowerCase();

  if (message.includes("simulate") || message.includes("test") || message.includes("banner")) {
    const report = runSimulation({
      productName: "Sportsbook + Casino",
      audienceMarket: "Estonia",
      variantName: "AI quick run",
      adMessage: demoBanner,
      personas: 1000,
    });

    return NextResponse.json({
      reply: "I ran a 1000-person synthetic audience simulation. Here are the projected FTD/NGR outcomes and recommendations.",
      report,
    });
  }

  return NextResponse.json({
    reply:
      "I can simulate target audiences, test funnel hypotheses, and forecast FTD/NGR. Ask me to simulate a banner, landing page, or offer.",
  });
}
