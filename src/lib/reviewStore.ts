import { seedReviews, type Review } from "./adminStore";

const STORAGE_KEY = "brightocity_reviews";

/** Returns all reviews (seed + customer-submitted), stored in localStorage. */
export function getReviews(): Review[] {
  if (typeof window === "undefined") return seedReviews;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Review[];
  } catch {}
  // First load: persist seed data so future writes merge correctly
  persistReviews(seedReviews);
  return seedReviews;
}

/** Overwrites the full review list in localStorage (used by admin CRUD). */
export function persistReviews(reviews: Review[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

/** Appends a single customer-submitted review to localStorage. */
export function appendReview(review: Review): void {
  const existing = getReviews();
  persistReviews([...existing, review]);
}
