import { Timestamp } from "firebase/firestore";

export interface Product {
  id?: string;
  title: string;
  slug: string;
  categories: string[];
  price: number;
  priceOnSale?: number;
  costPrice?: number;
  stock?: number;
  unitsSold?: number;
  materials?: string[];
  size?: {
    width: string;
    height: string;
    depth: string;
  };
  weight?: string;
  colors?: string[];
  variants?: string[];
  descriptionMarkdown?: string;
  searchKeywords?: string[];
  thumbnailId?: string;
  imageIds?: string[];
  pokemonData?: {
    pokemon: string;
    pokedexNumber: string;
    pokedexEntry: string;
    generation: string;
    typing: {
      typing1: string;
      typing2: string;
    };
    isShiny: boolean;
    gender: string;
  };
  printedModel?: {
    printTime: {
      hours: string;
      minutes: string;
    };
    description: string;
    printColors: {
      filamentId: string;
      grams: string;
    }[];
  };
  creatorManufacturer?: string;
  creatorManufacturerUrl?: string;
  eanBarcode?: string;
  productCode?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isTempFill?: boolean;
  sale?: {
    from: string;
    to: string;
  };
  feedback?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
