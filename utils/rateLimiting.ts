import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";

const MAX_ORDERS_PER_DAY = 5;

const hashString = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const getUserIP = async (): Promise<string | null> => {
  try {
    const response = await fetch("/api/get-ip");
    const data = await response.json();
    return await hashString(data.ip);
  } catch (error) {
    console.error("Error fetching IP:", error);
    return null;
  }
};

type RateLimitResult = { allowed: boolean; ordersToday: number; limit: number };

export const checkIPRateLimit = async (
  ipHash: string | null,
): Promise<RateLimitResult> => {
  if (!ipHash) {
    return { allowed: true, ordersToday: 0, limit: MAX_ORDERS_PER_DAY };
  }

  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const oneDayAgoTimestamp = Timestamp.fromDate(oneDayAgo);

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
    return { allowed: true, ordersToday: 0, limit: MAX_ORDERS_PER_DAY };
  }
};

export const getRateLimitMessage = (
  ordersToday: number,
  limit: number,
): string => {
  const remaining = limit - ordersToday;
  if (remaining <= 0) {
    return `You have reached the maximum of ${limit} orders per day. Please try again tomorrow.`;
  }
  if (remaining === 1) {
    return `You have 1 order remaining today.`;
  }
  return `You have ${remaining} orders remaining today.`;
};
