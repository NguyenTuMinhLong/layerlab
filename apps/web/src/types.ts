export interface NamedReference {
  _id: string;
  name?: string;
  slug?: string;
  fullName?: string;
  username?: string;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  designerId: NamedReference;
  categoryId: NamedReference;
  tags: string[];
  price: number;
  publishingYear: number;
  numOfFavorites: number;
  featured: boolean;
  previewVariant: number;
  sourceLabel?: string;
  sourceUrl?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Designer {
  _id: string;
  fullName: string;
  username: string;
  bio: string;
  location: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
}
