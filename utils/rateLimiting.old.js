import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";

// Maximum orders allowed per IP per day
const MAX_ORDERS_PER_DAY = 5;

/**
 * Hash a string using SHA-256
 * @param {string} text - The text to hash
 * @returns {Promise<string>} Hex string of hash
 */
const hashString = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Get the user's IP address and return a hashed version
 * Uses a free IP lookup service and hashes for privacy
 */
export const getUserIP = async () => {
  try {
    const response = await fetch("/api/get-ip");
    const data = await response.json();
    // Hash the IP before returning for privacy compliance
    return await hashString(data.ip);
  } catch (error) {
    console.error("Error fetching IP:", error);
    // Return null if we can't get IP - don't block the order
    return null;
  }
};

/**
 * Check if an IP address hash has exceeded the daily order limit
 * @param {string} ipHash - The hashed IP address to check
 * @returns {Promise<{allowed: boolean, ordersToday: number, limit: number}>}
 */
export const checkIPRateLimit = async (ipHash) => {
  // If we couldn't get IP hash, allow the order (fail open)
  if (!ipHash) {
    return { allowed: true, ordersToday: 0, limit: MAX_ORDERS_PER_DAY };
  }

  try {
    // Calculate timestamp for 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const oneDayAgoTimestamp = Timestamp.fromDate(oneDayAgo);

    // Query orders from this IP hash in the last 24 hours
    const ordersRef = collection(database, "orders");
    const q = query(
      ordersRef,
      where("ipHash", "==", ipHash),
      where("createdAt", ">=", oneDayAgoTimestamp),
    );

    const querySnapshot = await getDocs(q);
    const ordersToday = querySnapshot.size;

    return {
      allowed: ordersToday < MAX_ORDERS_PER_DAY,
      ordersToday,
      limit: MAX_ORDERS_PER_DAY,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // If there's an error checking, allow the order (fail open)
    return { allowed: true, ordersToday: 0, limit: MAX_ORDERS_PER_DAY };
  }
};

/**
 * Get a user-friendly message for rate limit status
 */
export const getRateLimitMessage = (ordersToday, limit) => {
  const remaining = limit - ordersToday;
  if (remaining <= 0) {
    return `You have reached the maximum of ${limit} orders per day. Please try again tomorrow.`;
  }
  if (remaining === 1) {
    return `You have 1 order remaining today.`;
  }
  return `You have ${remaining} orders remaining today.`;
};
