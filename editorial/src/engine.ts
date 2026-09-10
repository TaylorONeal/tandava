/** Fictional weekly economics. Dollars are whole USD; visits are not unique students. */
export const STARTING_CASH = 3200;
export const ROOMS = [
  {
    id: "cozy",
    name: "The cozy nook",
    mats: 14,
    fixed: 900,
    note: "A small space with a gentle lease.",
  },
  {
    id: "sunny",
    name: "The sunny loft",
    mats: 20,
    fixed: 1150,
    note: "More mats, a little more overhead.",
  },
  {
    id: "garden",
    name: "The garden room",
    mats: 28,
    fixed: 1450,
    note: "Lots of room. Give each extra mat a job.",
  },
] as const;
export type RoomId = (typeof ROOMS)[number]["id"];
export const WEEKS = [
  {
    title: "Hello, neighborhood.",
    note: "The doors are open. Give people a reason to roll out a mat.",
    demand: 0,
  },
  {
    title: "A friend brings a friend.",
    note: "The neighborhood walking club is trying yoga. Expect 12 extra visits.",
    demand: 12,
  },
  {
    title: "Find your rhythm.",
    note: "A quiet holiday week: 14 fewer visits. A little breathing room to experiment.",
    demand: -14,
  },
  {
    title: "Your room is becoming a ritual.",
    note: "A local café mentions your studio. Expect 20 extra visits.",
    demand: 20,
  },
  {
    title: "Make space for good things.",
    note: "People are finding their favorite classes. Expect 8 extra visits.",
    demand: 8,
  },
  {
    title: "A small studio. A lovely start.",
    note: "The neighborhood festival brings 24 extra visits. Finish with a little flourish.",
    demand: 24,
  },
];
export const IDEAS = [
  {
    id: "welcome",
    icon: "✦",
    name: "Bring-a-friend week",
    description: "An invitation travels further with a familiar face.",
    cost: 100,
    visits: 24,
    growth: 4,
    extraRevenue: 0,
    lesson:
      "Invitations fill mats today. Watch whether the extra class income covers the invitation cost.",
  },
  {
    id: "ritual",
    icon: "❋",
    name: "Build a lovely ritual",
    description: "Tea, a personal hello, and a reason to come back.",
    cost: 70,
    visits: 8,
    growth: 12,
    extraRevenue: 0,
    lesson:
      "Small investments in returning visitors compound: this ritual adds 12 visits to every later week.",
  },
  {
    id: "workshop",
    icon: "☀",
    name: "A Sunday mini-workshop",
    description: "Try something special with a small group.",
    cost: 190,
    visits: 0,
    growth: 3,
    extraRevenue: 330,
    lesson:
      "The workshop adds $330 of income and $190 of costs: $140 of contribution, not $330 of profit.",
  },
] as const;
export type IdeaId = (typeof IDEAS)[number]["id"];
export interface Plan {
  classes: number;
  yield: number;
  idea: IdeaId;
}
export interface WeekResult {
  week: number;
  plan: Plan;
  visits: number;
  demand: number;
  capacity: number;
  occupancy: number;
  classRevenue: number;
  extraRevenue: number;
  revenue: number;
  fixed: number;
  teaching: number;
  ownerPay: number;
  initiative: number;
  costs: number;
  net: number;
  cash: number;
  breakEvenVisits: number;
}
export interface Studio {
  room: RoomId;
  week: number;
  cash: number;
  growth: number;
  history: WeekResult[];
}
export const initialStudio = (room: RoomId = "cozy"): Studio => ({
  room,
  week: 0,
  cash: STARTING_CASH,
  growth: 0,
  history: [],
});
export const initialPlan = (): Plan => ({
  classes: 12,
  yield: 18,
  idea: "ritual",
});
export function forecast(studio: Studio, plan: Plan): WeekResult {
  if (studio.week >= WEEKS.length)
    throw new Error(
      "This season is complete. Start another to keep experimenting.",
    );
  if (
    ![8, 10, 12, 14, 16].includes(plan.classes) ||
    ![14, 18, 22].includes(plan.yield)
  )
    throw new Error("Choose a listed schedule and ticket mix.");
  const idea = IDEAS.find((item) => item.id === plan.idea);
  if (!idea) throw new Error("Choose an initiative.");
  // A simplified price/demand tradeoff, not an empirically calibrated forecast.
  const demand = Math.max(
    0,
    108 +
      studio.growth +
      WEEKS[studio.week].demand +
      idea.visits +
      (18 - plan.yield) * 5,
  );
  const room = ROOMS.find((r) => r.id === studio.room)!;
  const capacity = plan.classes * room.mats;
  const visits = Math.min(demand, capacity);
  const classRevenue = visits * plan.yield;
  const revenue = classRevenue + idea.extraRevenue;
  const fixed = room.fixed,
    ownerPay = 300,
    teaching = plan.classes * 55;
  const costs = fixed + ownerPay + teaching + idea.cost;
  const net = revenue - costs;
  return {
    week: studio.week,
    plan: { ...plan },
    visits,
    demand,
    capacity,
    occupancy: visits / capacity,
    classRevenue,
    extraRevenue: idea.extraRevenue,
    revenue,
    fixed,
    teaching,
    ownerPay,
    initiative: idea.cost,
    costs,
    net,
    cash: studio.cash + net,
    breakEvenVisits: Math.max(
      0,
      Math.ceil((costs - idea.extraRevenue) / plan.yield),
    ),
  };
}
export function playWeek(studio: Studio, plan: Plan): Studio {
  const result = forecast(studio, plan);
  const idea = IDEAS.find((item) => item.id === plan.idea)!;
  return {
    room: studio.room,
    week: studio.week + 1,
    cash: result.cash,
    growth: studio.growth + idea.growth,
    history: [...studio.history, result],
  };
}
export function badges(studio: Studio) {
  return [
    {
      name: "Room to breathe",
      earned: studio.history.some((r) => r.net >= 0),
      detail: "Cover a week’s costs, including your pay.",
    },
    {
      name: "Neighborhood favorite",
      earned: studio.history.some((r) => r.occupancy >= 0.8),
      detail: "Fill at least 80% of your available mats.",
    },
    {
      name: "Growing roots",
      earned: studio.growth >= 30,
      detail: "Add 30 recurring visits through your choices.",
    },
  ];
}
