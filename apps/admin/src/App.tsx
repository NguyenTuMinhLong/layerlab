import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type JSX,
} from "react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type Tab = "products" | "queue" | "orders" | "designers" | "categories";
type FormKind = "product" | "designer" | "category" | null;
interface Ref {
  _id: string;
  name?: string;
  slug?: string;
  fullName?: string;
  username?: string;
}
interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  designerId: Ref;
  categoryId: Ref;
  price: number;
  status: string;
  sourceLabel?: string;
}
interface Designer {
  _id: string;
  fullName: string;
  username: string;
  bio: string;
  location: string;
}
interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
}
interface Candidate {
  _id: string;
  title: string;
  description: string;
  suggestedCategorySlug: string;
  generationNote: string;
  previewVariant: number;
}
interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ title: string; quantity: number }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>("products");
  const [formKind, setFormKind] = useState<FormKind>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [queue, setQueue] = useState<Candidate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("Ready");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [
        nextProducts,
        nextDesigners,
        nextCategories,
        nextQueue,
        nextOrders,
      ] = await Promise.all([
        request<Product[]>("/products?includeDrafts=true"),
        request<Designer[]>("/designers"),
        request<Category[]>("/categories"),
        request<Candidate[]>("/generation-queue"),
        request<Order[]>("/orders"),
      ]);
      setProducts(nextProducts);
      setDesigners(nextDesigners);
      setCategories(nextCategories);
      setQueue(nextQueue);
      setOrders(nextOrders);
      setNotice("Data synced");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "API unavailable");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const revenue = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + order.total, 0),
    [orders],
  );

  async function perform(
    action: () => Promise<unknown>,
    success: string,
  ): Promise<void> {
    setBusy(true);
    try {
      await action();
      setNotice(success);
      setFormKind(null);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function createProduct(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await perform(
      () =>
        request("/products", {
          method: "POST",
          body: JSON.stringify({
            title: data.get("title"),
            slug: data.get("slug"),
            description: data.get("description"),
            designerId: data.get("designerId"),
            categoryId: data.get("categoryId"),
            tags: String(data.get("tags"))
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            price: Number(data.get("price")),
            previewVariant: Number(data.get("previewVariant")),
            status: data.get("status"),
            sourceLabel: "LayerLab Studio",
          }),
        }),
      "Product created",
    );
  }

  async function createDesigner(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    await perform(
      () =>
        request("/designers", { method: "POST", body: JSON.stringify(data) }),
      "Designer created",
    );
  }

  async function createCategory(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    await perform(
      () =>
        request("/categories", { method: "POST", body: JSON.stringify(data) }),
      "Category created",
    );
  }

  const tabs: Array<[Tab, string, number]> = [
    ["products", "Products", products.length],
    ["queue", "Generation queue", queue.length],
    ["orders", "Orders", orders.length],
    ["designers", "Designers", designers.length],
    ["categories", "Categories", categories.length],
  ];

  return (
    <div className="admin-shell">
      <aside>
        <a
          className="brand"
          href="#products"
          onClick={() => setTab("products")}
        >
          <span>Layer</span>
          <span>Lab</span>
          <small>Control</small>
        </a>
        <nav aria-label="Admin sections">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setFormKind(null);
                location.hash = id;
              }}
            >
              <span>{label}</span>
              <b>{count}</b>
            </button>
          ))}
        </nav>
        <a
          className="store-link"
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
        >
          Open storefront ↗
        </a>
      </aside>
      <main>
        <header>
          <div>
            <p>LOCAL OPERATIONS / {tab.toUpperCase()}</p>
            <h1>{tabs.find(([id]) => id === tab)?.[1]}</h1>
          </div>
          <div className="header-actions">
            <span className="status-dot">● {notice}</span>
            <button onClick={() => void refresh()} disabled={busy}>
              Refresh
            </button>
            {tab !== "orders" && tab !== "queue" && (
              <button
                className="primary"
                onClick={() =>
                  setFormKind(
                    tab === "products"
                      ? "product"
                      : tab === "designers"
                        ? "designer"
                        : "category",
                  )
                }
              >
                + New
              </button>
            )}
          </div>
        </header>
        <section className="metrics">
          <article>
            <small>Live products</small>
            <strong>
              {products.filter((p) => p.status === "published").length}
            </strong>
          </article>
          <article>
            <small>Queue health</small>
            <strong>{queue.length}/10</strong>
          </article>
          <article>
            <small>Open orders</small>
            <strong>
              {orders.filter((o) => o.status === "pending").length}
            </strong>
          </article>
          <article>
            <small>Recorded value</small>
            <strong>${revenue}</strong>
          </article>
        </section>

        {formKind === "product" && (
          <form
            className="editor"
            onSubmit={(event) => void createProduct(event)}
          >
            <div className="editor-title">
              <div>
                <p>NEW PRODUCT</p>
                <h2>Publish a component</h2>
              </div>
              <button type="button" onClick={() => setFormKind(null)}>
                Close
              </button>
            </div>
            <label>
              Title
              <input name="title" required minLength={3} />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            </label>
            <label className="wide">
              Description
              <textarea name="description" required minLength={12} />
            </label>
            <label>
              Designer
              <select name="designerId" required>
                {designers.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select name="categoryId" required>
                {categories.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tags
              <input name="tags" defaultValue="figma, monochrome" required />
            </label>
            <label>
              Price
              <input
                name="price"
                type="number"
                min="0"
                defaultValue="0"
                required
              />
            </label>
            <label>
              Artwork variant
              <select name="previewVariant">
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <button className="primary wide" disabled={busy}>
              Create product
            </button>
          </form>
        )}
        {formKind === "designer" && (
          <form
            className="editor"
            onSubmit={(event) => void createDesigner(event)}
          >
            <div className="editor-title">
              <h2>New designer</h2>
              <button type="button" onClick={() => setFormKind(null)}>
                Close
              </button>
            </div>
            <label>
              Full name
              <input name="fullName" required />
            </label>
            <label>
              Username
              <input name="username" required pattern="[a-z0-9_-]+" />
            </label>
            <label>
              Location
              <input name="location" required />
            </label>
            <label className="wide">
              Bio
              <textarea name="bio" required minLength={8} />
            </label>
            <button className="primary wide" disabled={busy}>
              Create designer
            </button>
          </form>
        )}
        {formKind === "category" && (
          <form
            className="editor"
            onSubmit={(event) => void createCategory(event)}
          >
            <div className="editor-title">
              <h2>New category</h2>
              <button type="button" onClick={() => setFormKind(null)}>
                Close
              </button>
            </div>
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            </label>
            <label className="wide">
              Description
              <textarea name="description" required minLength={8} />
            </label>
            <button className="primary wide" disabled={busy}>
              Create category
            </button>
          </form>
        )}

        {tab === "products" && (
          <section className="table-list">
            <div className="table-head">
              <span>Product</span>
              <span>Source</span>
              <span>Price</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {products.map((product) => (
              <article key={product._id}>
                <span>
                  <b>{product.title}</b>
                  <small>
                    {product.categoryId.name} · {product.designerId.fullName}
                  </small>
                </span>
                <span>{product.sourceLabel ?? "LayerLab"}</span>
                <span>
                  {product.price === 0 ? "Free" : `$${product.price}`}
                </span>
                <span>
                  <i className={`badge ${product.status}`}>{product.status}</i>
                </span>
                <span className="row-actions">
                  <button onClick={() => setNotice("Editing is coming soon")}>
                    Edit · soon
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      if (confirm(`Delete ${product.title}?`))
                        void perform(
                          () =>
                            request(`/products/${product._id}`, {
                              method: "DELETE",
                            }),
                          "Product deleted; queue replenished",
                        );
                    }}
                  >
                    Delete
                  </button>
                </span>
              </article>
            ))}
          </section>
        )}
        {tab === "queue" && (
          <section className="card-grid">
            {queue.map((candidate, index) => (
              <article className="candidate" key={candidate._id}>
                <span className="candidate-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{candidate.suggestedCategorySlug}</p>
                <h3>{candidate.title}</h3>
                <small>{candidate.description}</small>
                <footer>
                  <span>Ready to generate</span>
                  <button
                    className="primary"
                    disabled={busy || designers.length === 0}
                    onClick={() =>
                      void perform(
                        () =>
                          request(
                            `/generation-queue/${candidate._id}/publish`,
                            {
                              method: "POST",
                              body: JSON.stringify({
                                designerId: designers[0]?._id,
                                price: 0,
                              }),
                            },
                          ),
                        "Generated product published; queue refilled",
                      )
                    }
                  >
                    Publish free
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )}
        {tab === "orders" && (
          <section className="table-list orders">
            <div className="table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            {orders.length === 0 && (
              <div className="blank">
                No orders yet. Test checkout from the storefront.
              </div>
            )}
            {orders.map((order) => (
              <article key={order._id}>
                <span>
                  <b>{order.orderNumber}</b>
                  <small>{new Date(order.createdAt).toLocaleString()}</small>
                </span>
                <span>
                  {order.customerName}
                  <small>{order.customerEmail}</small>
                </span>
                <span>
                  {order.items
                    .map((item) => `${item.quantity}× ${item.title}`)
                    .join(", ")}
                </span>
                <span>${order.total}</span>
                <span>
                  <select
                    value={order.status}
                    onChange={(event) =>
                      void perform(
                        () =>
                          request(`/orders/${order._id}/status`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              status: event.target.value,
                            }),
                          }),
                        "Order status updated",
                      )
                    }
                  >
                    <option>pending</option>
                    <option>confirmed</option>
                    <option>fulfilled</option>
                    <option>cancelled</option>
                  </select>
                </span>
              </article>
            ))}
          </section>
        )}
        {tab === "designers" && (
          <section className="card-grid">
            {designers.map((designer) => (
              <article className="person" key={designer._id}>
                <span className="avatar">
                  {designer.fullName.slice(0, 2).toUpperCase()}
                </span>
                <h3>{designer.fullName}</h3>
                <p>
                  @{designer.username} · {designer.location}
                </p>
                <small>{designer.bio}</small>
                <footer>
                  <button onClick={() => setNotice("Editing is coming soon")}>
                    Edit · soon
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm(`Delete ${designer.fullName}?`))
                        void perform(
                          () =>
                            request(`/designers/${designer._id}`, {
                              method: "DELETE",
                            }),
                          "Designer deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )}
        {tab === "categories" && (
          <section className="card-grid">
            {categories.map((category) => (
              <article className="person" key={category._id}>
                <p>{category.slug}</p>
                <h3>{category.name}</h3>
                <small>{category.description}</small>
                <footer>
                  <button onClick={() => setNotice("Editing is coming soon")}>
                    Edit · soon
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm(`Delete ${category.name}?`))
                        void perform(
                          () =>
                            request(`/categories/${category._id}`, {
                              method: "DELETE",
                            }),
                          "Category deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
