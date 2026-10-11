# LayerLab MongoDB Design

LayerLab models a digital design marketplace in which independent designers publish Figma assets. Products reference designers and categories because those records have independent lifecycles and are reused across many products. Small product-specific values such as tags and compatibility targets remain embedded arrays because they are read with the product and do not require independent updates.

## Collections

### products

Each product contains its title, slug, description, designer and category references, tags, price, publishing year, favorite count, compatibility list, license, version, publication status, and preview variant. The collection has an ascending title index and a compound category and publishing-year index.

### designers

Each designer contains a full name, unique username, biography, location, and join date. The API joins products to designers when calculating creators with at least five published assets.

### categories

Categories store a reusable name, slug, and description. Product filters resolve a category slug or name to its object identifier before querying products.

### favorites

Favorites store a product reference and an anonymous visitor key. A unique compound index prevents the same visitor from favoriting the same product twice. The denormalized `numOfFavorites` field on products supports fast catalog reads and is recalculated after every favorite toggle.

### orders

Orders store customer contact details, status, a server-calculated total, and embedded item snapshots. Each snapshot preserves the product title and price at checkout while retaining a product reference for integrity checks and admin fulfillment.

### generationcandidates

Generation candidates are prebuilt component concepts with title, description, tags, suggested category, artwork variant, and source metadata. The queue service maintains exactly 10 ready candidates after reads, publications, and eligible product deletions.

## Relationship summary

- One designer publishes many products.
- One category contains many products.
- One product receives many favorite records.
- One order embeds one or more purchased product snapshots.
- Generation candidates are promoted into products and then replaced automatically.
- Tags, compatible tools, license, and version metadata are embedded in each product.
