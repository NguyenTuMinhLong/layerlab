import { fallbackCategories, fallbackProducts } from "./mock-data";
import type { Category, Designer, Order, Product } from "./types";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Loads marketplace data and falls back to the documented preview dataset. */
export async function loadMarketplace(): Promise<{
  categories: Category[];
  products: Product[];
  designers: Designer[];
  isPreview: boolean;
}> {
  try {
    const [categories, products, designers] = await Promise.all([
      request<Category[]>("/categories"),
      request<Product[]>("/products"),
      request<Designer[]>("/designers"),
    ]);
    return { categories, products, designers, isPreview: false };
  } catch {
    const designers = Array.from(
      new Map(
        fallbackProducts.map((product) => [
          product.designerId._id,
          {
            _id: product.designerId._id,
            fullName: product.designerId.fullName ?? "Community designer",
            username: product.designerId.username ?? "community",
            bio: "Independent interface designer.",
            location: "Figma Community",
          },
        ]),
      ).values(),
    );
    return {
      categories: fallbackCategories,
      products: fallbackProducts,
      designers,
      isPreview: true,
    };
  }
}

/** Toggles one visitor's favorite for a product. */
export function toggleFavorite(
  productId: string,
  visitorKey: string,
): Promise<{ favorited: boolean; numOfFavorites: number }> {
  return request(`/products/${productId}/favorite`, {
    method: "POST",
    body: JSON.stringify({ visitorKey }),
  });
}

/** Creates an order with server-calculated pricing. */
export function createOrder(input: {
  customerName: string;
  customerEmail: string;
  items: Array<{ productId: string; quantity: number }>;
}): Promise<Order> {
  return request("/orders", { method: "POST", body: JSON.stringify(input) });
}
