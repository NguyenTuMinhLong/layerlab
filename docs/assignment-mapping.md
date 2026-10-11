# Assignment Rubric Mapping

LayerLab preserves the technical intent of the supplied BookStore assignment while replacing the domain with a Figma component marketplace. Because the source assignment explicitly allows another topic with instructor approval, the domain substitution should be confirmed before submission.

| Assignment requirement                        | LayerLab implementation                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a MongoDB database                     | The default connection targets `LayerLabStore`.                                                                                                               |
| Design collections and valid documents        | `products`, `designers`, `categories`, `favorites`, `orders`, and `generationcandidates` are represented by Mongoose schemas and seeded or runtime documents. |
| Create an index on the title field            | `productSchema.index({ title: 1 })` creates the required title index.                                                                                         |
| Insert at least five documents                | The seed creates 10 products, 10 generation candidates, 5 designers, 5 categories, and 5 favorites.                                                           |
| Retrieve records created this year            | `GET /api/products/current-year` uses a start-of-year and end-of-year date range.                                                                             |
| Retrieve creators with at least five products | `GET /api/designers/established?minProducts=5` uses `$lookup`, `$size`, and `$match`.                                                                         |
| Filter by title content and category          | `GET /api/products/match?keyword=dashboard&category=Dashboard` combines a case-insensitive regular expression with the category relation.                     |
| Return selected fields                        | `GET /api/products/summary` projects `id`, `title`, `designer_full_name`, `publishing_year`, and `num_of_favorites`.                                          |

## Suggested demonstration order

1. Run the seed and show the four collections in MongoDB Compass.
2. Show the `title` index in the `products` collection.
3. Call each rubric endpoint and save a screenshot of its JSON response.
4. Open the storefront, search for “dashboard,” and filter the Dashboard category.
5. Explain why products reference designers and categories while tags and compatibility values are embedded arrays.
