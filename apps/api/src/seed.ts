import { config } from "./config.js";
import { connectDatabase, disconnectDatabase } from "./database.js";
import { Category } from "./models/category.model.js";
import { Designer } from "./models/designer.model.js";
import { Favorite } from "./models/favorite.model.js";
import { GenerationCandidate } from "./models/generation-candidate.model.js";
import { Order } from "./models/order.model.js";
import { Product } from "./models/product.model.js";
import { ensureGenerationQueue } from "./services/generation-queue.js";

await connectDatabase(config.mongoUri);

await Promise.all([
  Favorite.deleteMany({}),
  GenerationCandidate.deleteMany({}),
  Order.deleteMany({}),
  Product.deleteMany({}),
  Category.deleteMany({}),
  Designer.deleteMany({}),
]);

const categories = await Category.insertMany([
  {
    name: "Dashboard",
    slug: "dashboard",
    description: "Data-heavy admin and analytics interfaces.",
  },
  {
    name: "Mobile UI",
    slug: "mobile-ui",
    description: "Polished mobile application flows and screens.",
  },
  {
    name: "Landing Page",
    slug: "landing-page",
    description: "Conversion-focused marketing page systems.",
  },
  {
    name: "Design System",
    slug: "design-system",
    description: "Tokens, foundations, and reusable components.",
  },
  {
    name: "UI Kit",
    slug: "ui-kit",
    description: "Flexible interface building blocks for product teams.",
  },
]);

const designers = await Designer.insertMany([
  {
    fullName: "Mina Tran",
    username: "minatype",
    bio: "Design systems and editorial interfaces.",
    location: "Ho Chi Minh City",
  },
  {
    fullName: "Anh Nguyen",
    username: "anhframes",
    bio: "Product designer focused on analytical tools.",
    location: "Da Nang",
  },
  {
    fullName: "Khanh Le",
    username: "khanhcraft",
    bio: "Mobile interaction and prototyping specialist.",
    location: "Ha Noi",
  },
  {
    fullName: "Nora Vu",
    username: "noravu",
    bio: "Independent designer making quiet digital products.",
    location: "Hue",
  },
  {
    fullName: "Bao Pham",
    username: "baogrid",
    bio: "Grid systems, typography, and developer-ready UI.",
    location: "Can Tho",
  },
]);

const categoryBySlug = new Map(
  categories.map((category) => [category.slug, category]),
);
const [mina, anh, khanh, nora, bao] = designers;
const year = new Date().getFullYear();

if (!mina || !anh || !khanh || !nora || !bao) {
  throw new Error("Expected five seeded designers");
}

const products = await Product.insertMany([
  {
    title: "Purity UI Dashboard",
    slug: "purity-ui-dashboard",
    description:
      "A free, polished dashboard template curated from Figma Templates.",
    designerId: mina._id,
    categoryId: categoryBySlug.get("dashboard")?._id,
    tags: ["analytics", "saas", "charts"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 128,
    compatibleWith: ["Figma"],
    license: "Commercial",
    version: "2.1",
    featured: true,
    status: "published",
    previewVariant: 1,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1020707462188017225/purity-ui-dashboard-chakra-ui-dashboard/",
  },
  {
    title: "Vision UI Dashboard",
    slug: "vision-ui-dashboard",
    description: "A free dark dashboard with profile and sign-in screens.",
    designerId: mina._id,
    categoryId: categoryBySlug.get("dashboard")?._id,
    tags: ["dark", "editorial", "dashboard"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 94,
    compatibleWith: ["Figma"],
    license: "Commercial",
    version: "1.4",
    featured: true,
    status: "published",
    previewVariant: 2,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1060952013207459371/vision-ui-dashboard-react-mui-dashboard-free-version/",
  },
  {
    title: "Simple Dashboard Mockup",
    slug: "simple-dashboard-mockup",
    description: "A free minimal dashboard mockup with multiple chart styles.",
    designerId: mina._id,
    categoryId: categoryBySlug.get("landing-page")?._id,
    tags: ["portfolio", "type", "grid"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 77,
    compatibleWith: ["Figma"],
    license: "Personal",
    version: "1.0",
    featured: false,
    status: "published",
    previewVariant: 3,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1048559673287861086/dashboard/",
  },
  {
    title: "SaaS Selling Dashboard",
    slug: "saas-selling-dashboard",
    description: "A free sales dashboard template for SaaS product teams.",
    designerId: mina._id,
    categoryId: categoryBySlug.get("design-system")?._id,
    tags: ["tokens", "components", "variables"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 202,
    compatibleWith: ["Figma"],
    license: "Extended",
    version: "3.0",
    featured: true,
    status: "published",
    previewVariant: 4,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1140272887408902677/saas-selling-dashboard-admin-dashboard/",
  },
  {
    title: "Admin Dashboard Template",
    slug: "admin-dashboard-template",
    description:
      "A free light and dark admin dashboard with reusable components.",
    designerId: mina._id,
    categoryId: categoryBySlug.get("mobile-ui")?._id,
    tags: ["mobile", "ios", "messaging"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 65,
    compatibleWith: ["Figma"],
    license: "Commercial",
    version: "1.2",
    featured: false,
    status: "published",
    previewVariant: 5,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1098131983383434513/horizon-ui-trendiest-open-source-admin-template-dashboard/",
  },
  {
    title: "Free Crypto Dashboard",
    slug: "free-crypto-dashboard",
    description: "A free dark crypto dashboard with glowing, blurred surfaces.",
    designerId: anh._id,
    categoryId: categoryBySlug.get("dashboard")?._id,
    tags: ["finance", "reporting", "tables"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 89,
    compatibleWith: ["Figma"],
    license: "Commercial",
    version: "1.3",
    featured: true,
    status: "published",
    previewVariant: 6,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/885716846179508986/free-crypto-dashboard-recehtok-dark/",
  },
  {
    title: "Dashboard Builder",
    slug: "dashboard-builder",
    description:
      "A free dashboard builder with small, medium, and large UI kits.",
    designerId: khanh._id,
    categoryId: categoryBySlug.get("ui-kit")?._id,
    tags: ["commerce", "checkout", "catalog"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 113,
    compatibleWith: ["Figma"],
    license: "Commercial",
    version: "2.0",
    featured: false,
    status: "published",
    previewVariant: 1,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/993677252775666442/venus-dashboard-builder-2021-free-version/",
  },
  {
    title: "Analytics Dashboard",
    slug: "analytics-dashboard",
    description: "A free analytics template for internal company metrics.",
    designerId: nora._id,
    categoryId: categoryBySlug.get("mobile-ui")?._id,
    tags: ["notes", "productivity", "mobile"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 58,
    compatibleWith: ["Figma"],
    license: "Personal",
    version: "1.1",
    featured: false,
    status: "published",
    previewVariant: 2,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1152266255337829742/analytics-dashboard/",
  },
  {
    title: "CRM Dashboard Customers List",
    slug: "crm-dashboard-customers-list",
    description: "A free CRM customer list with high-level metric components.",
    designerId: bao._id,
    categoryId: categoryBySlug.get("landing-page")?._id,
    tags: ["marketing", "launch", "editorial"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 71,
    compatibleWith: ["Figma"],
    license: "Commercial",
    version: "1.5",
    featured: true,
    status: "published",
    previewVariant: 3,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1146467298668328949/crm-dashboard-customers-list/",
  },
  {
    title: "Cryptocurrency Dashboard",
    slug: "cryptocurrency-dashboard",
    description:
      "A free dark cryptocurrency dashboard with banners and charts.",
    designerId: bao._id,
    categoryId: categoryBySlug.get("design-system")?._id,
    tags: ["variables", "foundations", "tokens"],
    price: 0,
    publishingYear: year,
    numOfFavorites: 49,
    compatibleWith: ["Figma"],
    license: "Personal",
    version: "1.0",
    featured: false,
    status: "published",
    previewVariant: 4,
    sourceLabel: "Figma Templates",
    sourceUrl:
      "https://www.figma.com/community/file/1016909990118023467/cryptocurrency-dashboard-freebie/",
  },
]);

await Favorite.insertMany(
  products.slice(0, 5).map((product, index) => ({
    productId: product._id,
    visitorKey: `demo-visitor-${index + 1}`,
  })),
);

await ensureGenerationQueue();

console.log(
  `Seeded ${categories.length} categories, ${designers.length} designers, ${products.length} products, 5 favorites, and 10 generation candidates.`,
);
await disconnectDatabase();
