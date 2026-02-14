export function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    return Math.round((stake + (stake * odds) / 100) * 100) / 100;
  } else {
    return Math.round((stake + (stake * 100) / Math.abs(odds)) * 100) / 100;
  }
}
