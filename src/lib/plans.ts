// Pure maths for payment plans. Shared by the server and the live plan picker.

export type Plan = "full" | "monthly" | "weekly";

export type ScheduledPayment = { dueDate: Date; amountPence: number };

const DAY = 24 * 60 * 60 * 1000;

function dueDates(plan: Plan, from: Date, finalDate: Date): Date[] {
  if (plan === "full") return [from];
  const dates: Date[] = [];
  for (let i = 1; ; i++) {
    const d = new Date(from);
    if (plan === "weekly") d.setTime(from.getTime() + i * 7 * DAY);
    else d.setMonth(from.getMonth() + i);
    if (d > finalDate) break;
    dates.push(d);
  }
  // Too close to departure for instalments: everything is due now.
  return dates.length ? dates : [from];
}

/** Split the balance across the plan's dates. Every plan ends by the final balance date. */
export function buildSchedule(balancePence: number, plan: Plan, from: Date, finalDate: Date): ScheduledPayment[] {
  const dates = dueDates(plan, from, finalDate);
  const n = dates.length;
  const base = Math.floor(balancePence / n);
  const extra = balancePence - base * n;
  return dates.map((dueDate, i) => ({ dueDate, amountPence: base + (i < extra ? 1 : 0) }));
}

export function paymentCount(plan: Plan, from: Date, finalDate: Date) {
  return dueDates(plan, from, finalDate).length;
}
