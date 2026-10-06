export const DEPOSIT_PENCE = 5000;
export const FRIEND_DISCOUNT_PENCE = 1500;

export function gbp(pence: number, opts: { exact?: boolean } = {}) {
  const pounds = pence / 100;
  if (!opts.exact && Number.isInteger(pounds)) return `£${pounds.toLocaleString("en-GB")}`;
  return `£${pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Whole pounds, rounded up: "from £14 a week". */
export function gbpCeil(pence: number) {
  return `£${Math.ceil(pence / 100).toLocaleString("en-GB")}`;
}
