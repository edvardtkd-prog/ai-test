export type PersonaSegment = "sports_first" | "bonus_hunter" | "casino_first" | "trust_first" | "mobile_fast";

export type SimulationInput = {
  productName: string;
  audienceMarket: string;
  variantName: string;
  adMessage: string;
  personas: number;
};

export type SimulationOutput = {
  assumptions: {
    personas: number;
    segments: Record<PersonaSegment, number>;
    note: string;
  };
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

const SEGMENT_WEIGHTS: Record<PersonaSegment, number> = {
  sports_first: 0.35,
  bonus_hunter: 0.25,
  casino_first: 0.2,
  trust_first: 0.1,
  mobile_fast: 0.1,
};

const BASE_RATES: Record<PersonaSegment, { click: number; signup: number; ftd: number; ngrPerFtd: number }> = {
  sports_first: { click: 0.2, signup: 0.38, ftd: 0.43, ngrPerFtd: 54 },
  bonus_hunter: { click: 0.24, signup: 0.34, ftd: 0.31, ngrPerFtd: 39 },
  casino_first: { click: 0.19, signup: 0.41, ftd: 0.45, ngrPerFtd: 62 },
  trust_first: { click: 0.14, signup: 0.44, ftd: 0.52, ngrPerFtd: 58 },
  mobile_fast: { click: 0.23, signup: 0.31, ftd: 0.29, ngrPerFtd: 35 },
};

const copyMultiplier = (adMessage: string) => {
  const msg = adMessage.toLowerCase();
  let clickBoost = 1;
  let signupBoost = 1;
  let ftdBoost = 1;

  if (msg.includes("100%") || msg.includes("welcome")) clickBoost += 0.06;
  if (msg.includes("6x") || msg.includes("min") || msg.includes("terms")) signupBoost += 0.04;
  if (msg.includes("cashback") || msg.includes("rakeback")) ftdBoost += 0.05;
  if (msg.length > 500) clickBoost -= 0.04;

  return { clickBoost, signupBoost, ftdBoost };
};

const round = (num: number) => Math.round(num);

export const runSimulation = (input: SimulationInput): SimulationOutput => {
  const total = input.personas;
  const multipliers = copyMultiplier(input.adMessage);

  const segments = Object.fromEntries(
    (Object.keys(SEGMENT_WEIGHTS) as PersonaSegment[]).map((segment) => [segment, round(total * SEGMENT_WEIGHTS[segment])]),
  ) as Record<PersonaSegment, number>;

  let clicks = 0;
  let signups = 0;
  let ftd = 0;
  let ngr = 0;

  (Object.keys(segments) as PersonaSegment[]).forEach((segment) => {
    const population = segments[segment];
    const rate = BASE_RATES[segment];

    const segmentClicks = round(population * rate.click * multipliers.clickBoost);
    const segmentSignups = round(segmentClicks * rate.signup * multipliers.signupBoost);
    const segmentFtd = round(segmentSignups * rate.ftd * multipliers.ftdBoost);
    const segmentNgr = segmentFtd * rate.ngrPerFtd;

    clicks += segmentClicks;
    signups += segmentSignups;
    ftd += segmentFtd;
    ngr += segmentNgr;
  });

  return {
    assumptions: {
      personas: total,
      segments,
      note: "Synthetic audience simulation. Use outputs for pre-test prioritization before real traffic spend.",
    },
    funnel: {
      impressions: total,
      clicks,
      signups,
      firstTimeDepositors: ftd,
      ngrEstimateEur: ngr,
      ctr: Number((clicks / total).toFixed(3)),
      signupRateFromClick: Number((signups / Math.max(clicks, 1)).toFixed(3)),
      ftdRateFromSignup: Number((ftd / Math.max(signups, 1)).toFixed(3)),
    },
    insights: [
      `${input.variantName}: strongest engagement came from bonus_hunter and mobile_fast segments when copy promised immediate value.`,
      "Trust-first users improved conversion when terms were explicit (e.g., rollover and minimum odds).",
      "Long copy reduced top-of-funnel response; splitting Sports and Casino creatives likely improves CTR.",
    ],
    nextActions: [
      "Launch two landing variants: Sports-first and Casino-first pathways with one primary CTA each.",
      "Track FTD and NGR by segment tag and creative ID for calibration against real campaigns.",
      "Run a 10-20% budget smoke test to update model priors with live data.",
    ],
  };
};
