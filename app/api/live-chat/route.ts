import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runSimulation } from "@/lib/simulation";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const schema = z.object({
  messages: z.array(messageSchema).min(1),
  bannerText: z.string().min(10).optional(),
});

async function callOpenAI(userPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a conversion strategist for sportsbook/casino funnels. Keep answers concise, practical, and focused on FTD/NGR impact.",
        },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    output_text?: string;
  };

  return data.output_text ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const messages = parsed.data.messages;
  const userMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  try {
    const modelReply = await callOpenAI(userMessage);
    if (modelReply) {
      return NextResponse.json({
        reply: modelReply,
        source: "openai",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "live_chat_failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }

  const report = runSimulation({
    productName: "Sportsbook + Casino",
    audienceMarket: "Estonia",
    variantName: "Live chat quick estimate",
    adMessage: parsed.data.bannerText ?? "100% bonus up to 200 EUR, 6x rollover, cashback, rakeback.",
    personas: 1000,
  });

  return NextResponse.json({
    source: "fallback",
    reply:
      "Live API key is not configured, so I ran a local simulation fallback. Set OPENAI_API_KEY to enable real AI chat responses.",
    report,
  });
}
