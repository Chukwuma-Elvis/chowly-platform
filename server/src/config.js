// The schema is multi-tenant (a RESTAURANT owns every operational row, per the
// assessment feedback), but this deployment serves one active venue. A
// restaurant switcher would be a bonus feature layered on top of this constant.
export const RESTAURANT_ID = Number(process.env.RESTAURANT_ID) || 1;

// Categories that are prepared at the bar rather than the kitchen. Used to
// estimate an order's wait: the kitchen and the bar work in parallel, so the
// wait is the larger of the two queues, not their sum.
export const BAR_CATEGORIES = new Set(['drinks']);
