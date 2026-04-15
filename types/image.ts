import { Timestamp } from "firebase/firestore";

export interface Image {
  id: string;
  title: string;
  alt: string;
  url: string;
  createdAt: Timestamp;
}
