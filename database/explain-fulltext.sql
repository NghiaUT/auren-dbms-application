-- Run after db:indexes:apply. This is the same MATCH predicate as GET /api/products?q=sofa.
EXPLAIN SELECT id FROM products
  WHERE MATCH(name, collection_name, designer_name) AGAINST ('sofa' IN NATURAL LANGUAGE MODE);
EXPLAIN ANALYZE SELECT id FROM products
  WHERE MATCH(name, collection_name, designer_name) AGAINST ('sofa' IN NATURAL LANGUAGE MODE);

-- Include the joins and grouping of the catalog count query.
EXPLAIN SELECT COUNT(*) FROM (
  SELECT p.id, MIN(pv.price) AS minPrice
  FROM products p
  JOIN brands b ON p.brand_id = b.id
  JOIN categories c ON p.category_id = c.id
  JOIN product_variants pv ON p.id = pv.product_id
  WHERE pv.status = 'active'
    AND MATCH(p.name, p.collection_name, p.designer_name) AGAINST ('sofa' IN NATURAL LANGUAGE MODE)
  GROUP BY p.id
) AS filtered_products;
