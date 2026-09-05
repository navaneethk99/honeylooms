# Storefront conversion and search improvements

These changes prepare the website for better product discovery and fewer purchasing obstacles. They do not establish a measured conversion lift; compare results after deploying.

The storefront now includes shipping, payment and sizing guidance, an actionable campaign banner, readable product titles, sorting and filter recovery, and shopping FAQs. The banner uses one responsive image per slide and retains its original compact navigation dots. The homepage fetches only the eight products it displays.

Product pages put size selection, the current price and the purchase button before the long description. They distinguish a sold-out item from all available stock already being in the cart. The cart shows a subtotal and the COD surcharge separately; mobile checkout puts contact information first and makes guest checkout more prominent. Payment choices use native radio controls.

Search metadata now identifies individual product, collection and CMS URLs instead of inheriting a homepage canonical. Product structured data uses INR and rupees, reflects sale prices and variant stock, includes product images, and only emits existing aggregate ratings. Share metadata uses an existing image fallback. The sitemap includes the gallery and product images, avoids duplicate URLs, and excludes unpublished content. Preview deployments and draft views receive noindex metadata; search/filter combinations are not competing indexable pages. `/home` redirects to `/`.

## Measure after deployment

Use the existing PostHog project. Added events are emitted on `honeylooms.in` and `www.honeylooms.in`, excluding local/preview traffic:

| Event | Trigger |
| --- | --- |
| `storefront_cta_clicked` | A tracked campaign shopping link is clicked; includes placement and destination. |
| `product_viewed` | A product page mounts; includes product ID and slug. |
| `add_to_cart` | Adding an item has successfully updated the cart; includes product/variant IDs and quantity. |
| `checkout_started` | A nonempty checkout opens; includes item count, subtotal in rupees and currency. |
| `payment_started` | Payment initialization succeeds; includes payment method. |
| `purchase_completed` | COD order creation or online order confirmation succeeds; includes payment method. |

Create a funnel from `product_viewed` → `add_to_cart` → `checkout_started` → `purchase_completed`, using unique visitors and comparing mobile with desktop and organic with social traffic. Client analytics can be blocked or lost; use CMS orders and payment records for authoritative sales totals. A COD order is an order placed, not a collected payment. The new event properties contain no email, address, phone or access token.

After publishing, submit `/sitemap.xml` in Google Search Console and inspect representative product and collection URLs. Compare impressions, clicks, click-through rate, add-to-cart rate and completed orders against the preceding period. Record campaign and discount changes alongside these figures so they do not get mistaken for effects of the website changes. Google recommends allowing time for recrawling and measuring search impact over weeks. [Google SEO guidance](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

Check product markup with Google's Rich Results Test after deployment. Valid markup makes a product eligible for enhanced search presentation; it does not guarantee that presentation. [Google product structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)

## Validation

- Production build completed successfully; TypeScript passed.
- 16 focused tests passed across pricing, purchase state and SEO metadata.
- Browser verification covered shop sorting, size selection, adding a product to the cart, mobile cart layout, checkout navigation and the ₹25 COD adjustment. The temporary cart item was removed; no order or payment was submitted.
- The new and refactored core components pass targeted ESLint. Broader lint still reports an existing synchronous state update in the checkout coupon-invalidating effect, plus existing warnings; the coupon/payment calculation was preserved.
- No database schema change is required. This work does not deploy the site, submit a Search Console sitemap, or configure a PostHog dashboard.
