import type { Product } from "@/types/product";

const productFormFields: Omit<Product, "id"> & { id: string } = {
  id: "",
  title: "",
  slug: "",
  categories: [],
  price: 0,
  priceOnSale: 0,
  costPrice: 0,
  stock: 0,
  unitsSold: 0,
  materials: [],
  size: { width: "", height: "", depth: "" },
  weight: "",
  colors: [],
  variants: [],
  descriptionMarkdown: `## Product Overview, might not be needed

Enter a little bit of product information here

- List Element 1
- List Element 2 

### Title for more Info about the Product here

More info about product.`,

  searchKeywords: [],
  thumbnailId: "",
  imageIds: [],

  pokemonData: {
    pokemon: "",
    pokedexNumber: "",
    pokedexEntry: "",
    generation: "",
    typing: { typing1: "", typing2: "" },
    isShiny: false,
    gender: "",
  },

  printedModel: {
    printTime: { hours: "", minutes: "" },
    description: "",
    printColors: [{ filamentId: "", grams: "" }],
  },

  creatorManufacturer: "",
  creatorManufacturerUrl: "",
  eanBarcode: "",
  productCode: "",

  isActive: true,
  isFeatured: false,
  isTempFill: false,

  sale: {
    from: "",
    to: "",
  },

  feedback: [],
};

export default productFormFields;
