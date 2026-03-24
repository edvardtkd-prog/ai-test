import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runSimulation } from "@/lib/simulation";

const schema = z.object({
  productName: z.string().min(2),
  audienceMarket: z.string().min(2),
  variantName: z.string().min(2),
  adMessage: z.string().min(10),
  personas: z.number().int().min(100).max(5000).default(1000),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = runSimulation(parsed.data);
  return NextResponse.json(result);
}
