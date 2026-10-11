import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type JSX,
} from "react";

import { createOrder, loadMarketplace, toggleFavorite } from "./api";
import type { Category, Designer, Product } from "./types";

function ArrowIcon(): JSX.Element {
  return <span aria-hidden="true">↗</span>;
}

function ProductArtwork({ variant }: { variant: number }): JSX.Element {
  return (
    <div className={`product-art product-art--${variant}`} aria-hidden="true">
      <span className="art-sidebar" />
      <span className="art-window art-window--primary" />
      <span className="art-window art-window--secondary" />
      <span className="art-orbit" />
      <span className="art-label">LL/{String(variant).padStart(2, "0")}</span>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
  onFavorite,
  favorited,
}: {
  product: Product;
  onOpen: () => void;
  onFavorite: () => void;
  favorited: boolean;
}): JSX.Element {
  return (
    <article className="product-card">
      <button
        className="product-card__open"
        onClick={onOpen}
        aria-label={`View ${product.title}`}
      >
        <ProductArtwork variant={product.previewVariant} />
      </button>
      <div className="product-card__body">
        <div>
          <p className="eyebrow">{product.categoryId.name}</p>
          <button className="title-button" onClick={onOpen}>
            <h3>{product.title}</h3>
          </button>
          <p className="product-card__designer">
            {product.sourceLabel ?? `by ${product.designerId.fullName}`}
          </p>
        </div>
        <div className="product-card__meta">
          <span>{product.price === 0 ? "Free" : `$${product.price}`}</span>
          <button
            className={favorited ? "heart active" : "heart"}
            onClick={onFavorite}
            aria-label="Toggle favorite"
          >
            {favorited ? "♥" : "♡"} {product.numOfFavorites}
          </button>
        </div>
      </div>
    </article>
  );
}

export function App(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isPreview, setIsPreview] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<Product[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("layerlab-cart") ?? "[]",
      ) as Product[];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(
    () =>
      new Set(
        JSON.parse(
          localStorage.getItem("layerlab-favorites") ?? "[]",
        ) as string[],
      ),
  );
  const [message, setMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadMarketplace().then((data) => {
      setProducts(data.products);
      setCategories(data.categories);
      setDesigners(data.designers);
      setIsPreview(data.isPreview);
    });
  }, []);
  useEffect(() => {
    localStorage.setItem("layerlab-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("layerlab-favorites", JSON.stringify([...favorites]));
  }, [favorites]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        (activeCategory === "all" ||
          product.categoryId.slug === activeCategory) &&
        (!term ||
          [product.title, product.description, ...product.tags]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }, [activeCategory, products, search]);
  const total = cart.reduce((sum, product) => sum + product.price, 0);

  function addToCart(product: Product): void {
    setCart((current) =>
      current.some((item) => item._id === product._id)
        ? current
        : [...current, product],
    );
    setSelected(null);
    setCartOpen(true);
    setMessage(`${product.title} added`);
  }

  async function favorite(product: Product): Promise<void> {
    if (isPreview) {
      setMessage("Connect the API to save favorites");
      return;
    }
    let visitorKey = localStorage.getItem("layerlab-visitor");
    if (!visitorKey) {
      visitorKey = crypto.randomUUID();
      localStorage.setItem("layerlab-visitor", visitorKey);
    }
    try {
      const result = await toggleFavorite(product._id, visitorKey);
      setProducts((current) =>
        current.map((item) =>
          item._id === product._id
            ? { ...item, numOfFavorites: result.numOfFavorites }
            : item,
        ),
      );
      setFavorites((current) => {
        const next = new Set(current);
        result.favorited ? next.add(product._id) : next.delete(product._id);
        return next;
      });
    } catch {
      setMessage("Could not update favorite");
    }
  }

  async function checkout(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const order = await createOrder({
        customerName: String(data.get("name")),
        customerEmail: String(data.get("email")),
        items: cart.map((product) => ({ productId: product._id, quantity: 1 })),
      });
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setMessage(`Order ${order.orderNumber} created. Check your inbox next.`);
    } catch {
      setMessage("Checkout needs the local API and MongoDB running.");
    }
  }

  return (
    <main>
      <header className="site-header">
        <nav className="site-nav" aria-label="Primary navigation">
          <div className="site-nav__group">
            <a href="#components">Components</a>
            <a href="#collections">Collections</a>
            <a href="#designers">Designers</a>
          </div>
          <a className="wordmark" href="#top" aria-label="LayerLab home">
            <span>Layer</span>
            <span>Lab</span>
          </a>
          <div className="site-nav__group site-nav__group--right">
            <a href="#community">Community</a>
            <a href="#about">About</a>
            <button className="cart-button" onClick={() => setCartOpen(true)}>
              Cart [{cart.length}]
            </button>
          </div>
        </nav>
      </header>
      {message && (
        <button className="toast" onClick={() => setMessage("")}>
          {message} ×
        </button>
      )}
      <section className="hero" id="top">
        <div className="hero__copy">
          <div className="release-pill">
            <span /> 10 free finds · updated weekly
          </div>
          <h1>
            Design less.
            <br />
            Ship something
            <br />
            yours.
          </h1>
          <p className="hero__lede">
            Free Figma components curated for designers who want to build, not
            repeat.
          </p>
          <div className="hero__actions">
            <a className="button button--light" href="#components">
              Explore components <ArrowIcon />
            </a>
            <a
              className="button button--dark"
              href="http://localhost:3000/#products"
            >
              Sell your work <ArrowIcon />
            </a>
          </div>
          <label className="search-box">
            <span className="search-box__icon" aria-hidden="true">
              ⌕
            </span>
            <span className="sr-only">Search components</span>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search components..."
            />
            <kbd>⌘ K</kbd>
          </label>
          {isPreview && (
            <p className="preview-note">
              Preview data · run MongoDB and the API for checkout
            </p>
          )}
        </div>
        <div
          className="hero__visual"
          aria-label="LayerLab creative interface artwork"
        >
          <div className="hero__grid" />
          <img
            src="/hero-art.png"
            alt="Monochrome sculpture arranging interface component panels"
          />
          <span className="hero__marker hero__marker--one" />
          <span className="hero__marker hero__marker--two" />
          <div className="hero__caption">
            <span>01</span> Interfaces for original ideas
          </div>
        </div>
      </section>
      <section className="catalog" id="components">
        <div className="catalog__heading">
          <div>
            <p className="eyebrow">Curated release 01</p>
            <h2>Free components</h2>
          </div>
          <p>
            Ten live resources, source-linked and ready to open in Figma.
            Inspect every detail, then make it your own.
          </p>
        </div>
        <div
          className="category-row"
          id="collections"
          aria-label="Filter products by category"
        >
          <button
            className={activeCategory === "all" ? "is-active" : ""}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              className={activeCategory === category.slug ? "is-active" : ""}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onOpen={() => setSelected(product)}
              onFavorite={() => void favorite(product)}
              favorited={favorites.has(product._id)}
            />
          ))}
        </div>
        {visibleProducts.length === 0 && (
          <p className="empty-state">
            No components match this search.{" "}
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
            >
              Clear filters
            </button>
          </p>
        )}
      </section>
      <section className="designers" id="designers">
        <div>
          <p className="eyebrow">The people behind the pixels</p>
          <h2>
            Independent minds,
            <br />
            shared systems.
          </h2>
        </div>
        <div className="designer-list">
          {designers.slice(0, 5).map((designer, index) => (
            <article key={designer._id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{designer.fullName}</h3>
                <p>
                  @{designer.username} · {designer.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="community" id="community">
        <p className="eyebrow">LayerLab community</p>
        <h2>Have a component worth sharing?</h2>
        <p>
          Use the local studio to publish your own work, manage collections, and
          fulfill real orders.
        </p>
        <a
          className="button button--light"
          href="http://localhost:3000/#products"
        >
          Open creator studio <ArrowIcon />
        </a>
      </section>
      <section className="manifesto" id="about">
        <p className="eyebrow">
          Built for the work between ideas and interfaces
        </p>
        <h2>Every component is a starting point, not a finished opinion.</h2>
        <div className="manifesto__columns">
          <p>
            LayerLab curates adaptable interface systems and always links to the
            original source. Browse by intent, inspect the structure, and shape
            each asset around your own product.
          </p>
          <dl>
            <div>
              <dt>{products.length || "—"}</dt>
              <dd>Live products</dd>
            </div>
            <div>
              <dt>{categories.length || "—"}</dt>
              <dd>Collections</dd>
            </div>
            <div>
              <dt>10</dt>
              <dd>Ready to generate</dd>
            </div>
          </dl>
        </div>
      </section>
      <footer>
        <a className="wordmark wordmark--footer" href="#top">
          <span>Layer</span>
          <span>Lab</span>
        </a>
        <p>Free Figma components for digital creators.</p>
        <p>
          <a href="http://localhost:3000">Creator control →</a>
        </p>
      </footer>
      {selected && (
        <div
          className="overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
          >
            <button className="modal-close" onClick={() => setSelected(null)}>
              Close ×
            </button>
            <ProductArtwork variant={selected.previewVariant} />
            <div className="modal-copy">
              <p className="eyebrow">
                {selected.categoryId.name} ·{" "}
                {selected.sourceLabel ?? "LayerLab"}
              </p>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
              <ul>
                <li>Figma compatible</li>
                <li>Version 1.0</li>
                <li>
                  {selected.price === 0
                    ? "Free resource"
                    : `$${selected.price}`}
                </li>
              </ul>
              <div className="modal-actions">
                <button
                  className="button button--light"
                  onClick={() => addToCart(selected)}
                >
                  Add {selected.price === 0 ? "free" : "to cart"} <ArrowIcon />
                </button>
                {selected.sourceUrl && (
                  <a
                    className="button button--dark"
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source <ArrowIcon />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
      {cartOpen && (
        <div
          className="overlay drawer-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <aside className="cart-drawer">
            <header>
              <div>
                <p className="eyebrow">Your selection</p>
                <h2>Cart [{cart.length}]</h2>
              </div>
              <button onClick={() => setCartOpen(false)}>Close ×</button>
            </header>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <p>Your cart is empty.</p>
                <button onClick={() => setCartOpen(false)}>
                  Keep browsing
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((product) => (
                    <article key={product._id}>
                      <ProductArtwork variant={product.previewVariant} />
                      <div>
                        <h3>{product.title}</h3>
                        <p>
                          {product.price === 0 ? "Free" : `$${product.price}`}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setCart((current) =>
                            current.filter((item) => item._id !== product._id),
                          )
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
                <footer>
                  <span>Total</span>
                  <strong>${total}</strong>
                  <button
                    className="button button--light"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    Checkout <ArrowIcon />
                  </button>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}
      {checkoutOpen && (
        <div className="overlay">
          <form className="checkout" onSubmit={(event) => void checkout(event)}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setCheckoutOpen(false)}
            >
              Close ×
            </button>
            <p className="eyebrow">Secure request</p>
            <h2>Complete order</h2>
            <p>
              No payment is collected. The order is saved for admin fulfillment.
            </p>
            <label>
              Name
              <input name="name" required minLength={2} autoFocus />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <div className="checkout-total">
              <span>{cart.length} products</span>
              <strong>${total}</strong>
            </div>
            <button
              className="button button--light"
              disabled={cart.length === 0}
            >
              Place order <ArrowIcon />
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
