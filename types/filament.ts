import type { Timestamp } from "firebase/firestore";

export type FilamentMaterial =
  | "PLA"
  | "PLA+"
  | "PETG"
  | "ABS"
  | "TPU"
  | "FLEX"
  | "Nylon"
  | "ASA"
  | "PC"
  | "PVA"
  | "HIPS"
  | "Carbon Fiber"
  | "Other";

export interface Filament {
  id: string;
  name: string;
  brand: string;
  material: FilamentMaterial;
  finish?: string;
  color?: string;
  hexColor: string;
  weightRemaining: number | null;
  weightTotal: number | null;
  diameter: number;
  settingsLink?: string;
  gramsOrdered?: number | null;
  storageLocation?: string;
  costPerKg?: number | null;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
