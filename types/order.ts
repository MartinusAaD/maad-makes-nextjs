import type { Timestamp } from "firebase/firestore";

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  comment?: string;
}

export interface OrderItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice: number;
  isOnSale: boolean;
  thumbnailId?: string;
  quantity: number;
}

export interface OrderHistoryEntry {
  field: string;
  oldValue?: string;
  newValue?: string;
  value?: string;
  timestamp: Timestamp;
}

export type OrderStatus =
  | "pending"
  | "active"
  | "printing"
  | "printed"
  | "shipped"
  | "completed"
  | "cancelled";

export type PaymentMethod =
  | "vipps"
  | "finn"
  | "bank transfer"
  | "cash"
  | "free"
  | "other"
  | null;

export interface Order {
  id: string;
  orderNumber: number | "DEMO";
  customerNumber?: number | null;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  savings: number;
  total: number;
  status: OrderStatus;
  isPaid: boolean;
  paymentMethod: PaymentMethod;
  trackingCode?: string;
  shippingProvider?: string;
  notes?: string;
  ipHash?: string | null;
  isDemo?: boolean;
  isRefunded?: boolean;
  shippedEmailSent?: boolean;
  cancelledBy?: string;
  cancellationAcknowledged?: boolean;
  cancellationReason?: string;
  history: OrderHistoryEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
