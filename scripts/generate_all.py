#!/usr/bin/env python3
"""
Full NEXUS Enterprise Dataset Generator
"""

import os
import json

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/data/nexus'))
os.makedirs(OUT_DIR, exist_ok=True)

from build_nexus_fixtures import TEAMS, PROJECT, USERS, CYCLES, MILESTONES

# Titles and technical descriptions for 300 issues across 13 workstreams
WORKSTREAM_DATA = [
    # Workstream 1: Identity, Accounts & Permissions (NEX-1 to NEX-22)
    [
        ("Implement OIDC authorization code flow with PKCE for web storefront", "Implement RFC 7636 Proof Key for Code Exchange (PKCE) for the customer web application.\n\n### Acceptance Criteria\n- Generates SHA-256 code challenge on login initiation\n- Exchanges authorization code with identity provider securely\n- Stores session tokens in HttpOnly, SameSite=Strict cookies\n- Zero token exposure in browser memory dumps", "DONE", "HIGH", "usr_alex", "cycle_cp_21", "ms_arch"),
        ("Design JWT access token claims specification and RS256 signature verification", "Establish standard JWT payload schema containing subject, tenantId, roles, and scope claims.\n\n### Acceptance Criteria\n- Token signed with RSA-256 with 2048-bit key\n- Public JWKS endpoint exposed at `/.well-known/jwks.json`\n- Token lifetime set to 15 minutes with rolling refresh token\n- Fastify middleware decodes and verifies signature in under 1.5ms", "DONE", "HIGH", "usr_alex", "cycle_cp_21", "ms_arch"),
        ("Configure Redis distributed blacklist for instant token revocation", "Implement an atomic token revocation blacklist using Redis key-value storage with TTL matching token expiry.\n\n### Acceptance Criteria\n- Blacklist lookup integrated into API gateway JWT guard\n- Lua script guarantees atomic insertion and TTL assignment\n- Sub-millisecond latency under 5,000 requests/sec spike\n- Graceful fallback to database revocation log on Redis connection error", "DONE", "URGENT", "usr_elena", "cycle_cp_21", "ms_arch"),
        ("Establish SAML 2.0 federation endpoints for enterprise merchant SSO", "Build SAML 2.0 Identity Provider (IdP) integration for enterprise merchant staff access.\n\n### Acceptance Criteria\n- Supports Okta, Azure AD, and PingFederate metadata import\n- Assertion signature and encryption validation\n- Automated Just-In-Time (JIT) staff provisioning\n- RelayState CSRF defense validation", "DONE", "MEDIUM", "usr_tariq", "cycle_cp_22", "ms_arch"),
        ("Implement multi-factor authentication (MFA) TOTP enrollment flow", "Allow merchant staff and customers to enable RFC 6238 Time-based One-Time Password authentication.\n\n### Acceptance Criteria\n- Generates base32 secret and QR code URI\n- Verifies two consecutive TOTP codes before activation\n- Generates 8 single-use cryptographic recovery backup codes\n- Rate-limits TOTP submission attempts to 5 per minute", "DONE", "HIGH", "usr_sarah", "cycle_cp_22", "ms_arch"),
        ("Build customer session cookie rotation with strict SameSite attributes", "Mitigate session fixation by rotating session identifiers upon privilege level elevation.\n\n### Acceptance Criteria\n- Session ID rotated upon authentication and privilege changes\n- Cookies set with `Secure`, `HttpOnly`, and `SameSite=Strict`\n- Old session token marked invalid in Redis session store\n- Cross-origin credentials requests rejected by CORS policy", "DONE", "MEDIUM", "usr_alex", "cycle_cp_22", "ms_arch"),
        ("Implement fine-grained RBAC permissions evaluator for merchant organization roles", "Design hierarchical permission evaluation service covering ADMIN, MERCHANDISER, SUPPORT, and OBSERVER.\n\n### Acceptance Criteria\n- Bitmask permission evaluation for sub-millisecond checks\n- Workspace and store-level scoping rules\n- Role inheritance hierarchy enforced without recursion\n- Unit test coverage exceeding 95% on permission matrix", "DONE", "HIGH", "usr_sarah", "cycle_cp_22", "ms_arch"),
        ("Create customer account profile management API with email change verification", "Build REST endpoints for updating customer personal details and initiating email re-verification.\n\n### Acceptance Criteria\n- Sends verification link to new email address before updating\n- Requires re-authentication before modifying sensitive profile fields\n- Rate-limited to 3 modification requests per hour\n- Emits `CUSTOMER_PROFILE_UPDATED` event to audit bus", "DONE", "MEDIUM", "usr_david", "cycle_cp_23", "ms_arch"),
        ("Establish customer address book service with standardized postal codes", "Build service for managing multiple shipping and billing addresses per customer account.\n\n### Acceptance Criteria\n- Supports ISO-3166-1 alpha-2 country codes\n- Validates postal code formatting per country specification\n- Supports designating default shipping and default billing addresses\n- Soft-deletes removed addresses without breaking past order references", "DONE", "LOW", "usr_marcus", "cycle_cp_23", "ms_arch"),
        ("Build passwordless magic link authentication service with HMAC expiration", "Enable passwordless email login using cryptographically signed single-use URLs.\n\n### Acceptance Criteria\n- Magic link token signed with HMAC-SHA256 and 15-minute TTL\n- Single-use enforced via atomic Redis key consumption\n- IP binding warning when user opens link from different ASN\n- Constant-time token comparison preventing timing attacks", "DONE", "MEDIUM", "usr_nathan", "cycle_cp_23", "ms_arch"),
        ("Implement customer consent management service for GDPR and CCPA preferences", "Provide granular consent tracking for marketing cookies, analytics, and data sharing.\n\n### Acceptance Criteria\n- Stores timestamped consent revision history\n- Exposes consent querying API for storefront tag managers\n- Supports one-click withdrawal of consent\n- Encrypted audit trail retained for legal compliance", "IN_PROGRESS", "MEDIUM", "usr_artur", "cycle_cp_25", "ms_arch"),
        ("Implement rate-limiting middleware for authentication endpoints via Token Bucket", "Protect login, signup, and password reset endpoints from brute-force credential stuffing.\n\n### Acceptance Criteria\n- Token bucket algorithm implemented with Redis atomic operations\n- 10 attempts per minute per IP address on login routes\n- Returns 429 Too Many Requests with `Retry-After` header\n- Whitelist support for internal health check probes", "IN_PROGRESS", "URGENT", "usr_elena", "cycle_cp_25", "ms_arch"),
        ("Build merchant staff invitation state machine with expiring secure tokens", "Allow merchant administrators to invite team members with specific organizational roles.\n\n### Acceptance Criteria\n- Generates 256-bit entropy token with 72-hour expiration\n- Email invitation containing branded acceptance link\n- Prevents duplicate pending invitations for same email address\n- Supports revoking pending invitations by workspace admin", "IN_PROGRESS", "HIGH", "usr_sarah", "cycle_cp_25", "ms_arch"),
        ("Implement customer account deletion workflow with cascading pseudonymization", "Support GDPR Article 17 Right to Erasure while preserving legal tax and order records.\n\n### Acceptance Criteria\n- Anonymizes PII across customer, cart, and analytics tables\n- Retains immutable order records with pseudonymized customer references\n- Revokes all active session tokens immediately\n- Dispatches confirmation receipt upon completion", "IN_REVIEW", "HIGH", "usr_artur", "cycle_cp_25", "ms_arch"),
        ("Provision API Key credentials service with cryptographically secure secret hashing", "Allow merchant integrations and backend scripts to authenticate using scoped API keys.\n\n### Acceptance Criteria\n- Keys prefixed with environment (`nex_live_` / `nex_test_`)\n- Secret stored as Argon2id cryptographic hash\n- Supports permission scope restriction (read-only orders, write-catalog)\n- Usage metrics incremented per API request", "IN_REVIEW", "MEDIUM", "usr_tariq", "cycle_cp_25", "ms_arch"),
        ("Implement SCIM 2.0 user provisioning provider for enterprise Okta integration", "Support automated merchant employee onboarding and de-provisioning via SCIM.\n\n### Acceptance Criteria\n- Implements `/scim/v2/Users` and `/scim/v2/Groups` endpoints\n- Handles create, update, and de-activate user actions\n- Bearer token authentication with tenant isolation\n- Strict schema validation compliant with RFC 7643", "TODO", "MEDIUM", "usr_tariq", "cycle_cp_26", "ms_arch"),
        ("Build session invalidation webhook dispatcher for global customer logout", "Broadcast session termination events across web, mobile, and third-party apps.\n\n### Acceptance Criteria\n- Signs webhook payload using HMAC-SHA256 shared secret\n- Retries failed webhooks with exponential backoff up to 5 times\n- Dispatched when customer changes password or terminates all sessions\n- Latency under 250ms from trigger to delivery", "TODO", "LOW", "usr_nathan", "cycle_cp_26", "ms_arch"),
        ("Implement suspicious login anomaly detector with IP geolocation risk scoring", "Evaluate login risk using IP reputation, device fingerprint, and geographical velocity.\n\n### Acceptance Criteria\n- Triggers email verification challenge when impossible travel detected\n- Integrates with MaxMind GeoIP2 precision database\n- Low-confidence score flags account for admin inspection\n- Logs risk score breakdown to security event pipeline", "TODO", "HIGH", "usr_vikram", "cycle_cp_26", "ms_arch"),
        ("Create biometric WebAuthn / Passkeys registration and verification handler", "Allow customer authentication using FIDO2 biometric authentication hardware.\n\n### Acceptance Criteria\n- Supports Apple TouchID, FaceID, and Windows Hello authenticators\n- Stores public key and credential ID securely\n- Challenge-response verification complies with W3C WebAuthn Level 3\n- Fallback to password or magic link authentication", "BACKLOG", "MEDIUM", "usr_alex", None, "ms_arch"),
        ("Build merchant organization switching context guard in API gateway", "Ensure merchant staff can seamlessly switch between multiple stores without token bleed.\n\n### Acceptance Criteria\n- Organization context passed via `X-Nexus-Org-Id` header\n- Verifies active membership before routing request to downstream service\n- Caches membership authorization for 30 seconds in Envoy proxy\n- Rejects requests to unauthorized stores with 403 Forbidden", "CANCELLED", "MEDIUM", "usr_tariq", None, "ms_arch"),
        ("Audit customer OAuth refresh token rotation and reuse detection", "Verify that reuse of an invalidated refresh token revokes all descendant tokens.\n\n### Acceptance Criteria\n- Family-based refresh token tracking\n- Detecting reuse revokes all tokens issued to that client session\n- Alert dispatched to security operations center\n- Full unit test coverage of token reuse race conditions", "IN_REVIEW", "HIGH", "usr_alex", "cycle_cp_25", "ms_arch"),
        ("Finalize customer account security settings UI in customer profile portal", "Build responsive user interface for managing passwords, MFA, and active sessions.\n\n### Acceptance Criteria\n- Displays active login sessions with device and location metadata\n- Provides 'Log out of all devices' one-click action\n- Clean modal flow for enrolling authenticator app\n- Fully accessible keyboard navigation and screen reader support", "TODO", "MEDIUM", "usr_marcus", "cycle_cp_26", "ms_arch"),
    ],

    # Workstream 2: Product Catalog & Merchandising (NEX-23 to NEX-46)
    [
        ("Implement hierarchical product taxonomy tree with dynamic category attributes", "Build recursive category model with breadcrumb path generation and inherited attributes.\n\n### Acceptance Criteria\n- Supports arbitrary nesting depth up to 8 levels\n- Materialized path querying for high-speed subcategory resolution\n- Child categories inherit filterable attribute definitions\n- Cached in Redis with automated invalidation on category update", "DONE", "HIGH", "usr_david", "cycle_cp_22", "ms_catalog"),
        ("Design multi-dimensional product variant matrix schema (Size, Color, Material)", "Structure variant combinations with unique SKUs, barcode mappings, and pricing overrides.\n\n### Acceptance Criteria\n- Cartesian product generator for option value permutations\n- Supports up to 250 variants per parent product\n- Variant-specific images, dimensions, and weights\n- Schema validated with strict database foreign keys", "DONE", "HIGH", "usr_carlos", "cycle_cp_22", "ms_catalog"),
        ("Build localized product title and description storage using PostgreSQL JSONB", "Support multi-language catalog content with fallback to default workspace language.\n\n### Acceptance Criteria\n- JSONB storage indexed with GIN indices for full-text search\n- Fallback resolution: Requested Locale -> Tenant Default -> English\n- Supports rich markdown descriptions and sanitization\n- Sub-5ms retrieval overhead on multi-language queries", "DONE", "MEDIUM", "usr_zoe", "cycle_cp_22", "ms_catalog"),
        ("Establish high-throughput product catalog read replica query service", "Implement read-optimized querying layer targeting PostgreSQL read replicas.\n\n### Acceptance Criteria\n- PgBouncer read pool with transaction pooling\n- Automatic failover between replicas on health check failure\n- Replication lag detection triggering primary read fallback if lag > 2s\n- Sustains 12,000 read queries/sec in load test", "DONE", "URGENT", "usr_elena", "cycle_cp_23", "ms_catalog"),
        ("Implement dynamic pricing engine with tiered quantity discounting rules", "Calculate unit prices based on customer tier, order volume, and active sales campaigns.\n\n### Acceptance Criteria\n- Evaluates volume break tables (e.g., 10+ units = 10% off)\n- Supports customer group pricing overrides (Wholesale vs Retail)\n- Priority resolution prevents unintended coupon stacking\n- Calculation completes in under 2ms per cart item", "DONE", "HIGH", "usr_carlos", "cycle_cp_23", "ms_catalog"),
        ("Build product media asset pipeline with automated WebP/AVIF generation", "Process merchant image uploads into responsive image sizes with modern formats.\n\n### Acceptance Criteria\n- Converts raw uploads into AVIF, WebP, and JPEG fallback formats\n- Generates thumbnail, catalog, and high-res zoom dimensions\n- Uploads to CDN storage with immutable cache headers\n- Image optimization achieves 65% average payload reduction", "DONE", "MEDIUM", "usr_andre", "cycle_cp_23", "ms_catalog"),
        ("Create SKU generation service with deterministic barcode allocation (EAN-13 / UPC)", "Generate unique SKUs and check-digit verified barcodes for new catalog variants.\n\n### Acceptance Criteria\n- Calculates Modulo-10 checksum for EAN-13 and UPC-A\n- Prevents duplicate barcode collision across all tenant SKUs\n- Configurable prefix template based on brand and category\n- High-speed batch generation API", "DONE", "LOW", "usr_samira", "cycle_cp_23", "ms_catalog"),
        ("Implement scheduled catalog publishing pipeline with future effective dates", "Allow merchandisers to stage seasonal catalog updates that go live automatically.\n\n### Acceptance Criteria\n- Supports publish_at and unpublish_at timestamps\n- Background cron worker activates scheduled items within 60s of target\n- Automatic search index update and CDN cache purge on activation\n- Preview mode available for authenticated merchant staff", "DONE", "HIGH", "usr_david", "cycle_cp_24", "ms_catalog"),
        ("Build bulk product import processor supporting CSV and Excel spreadsheets", "Process merchant spreadsheets with thousands of product rows asynchronously.\n\n### Acceptance Criteria\n- Streams parsing using Node.js streams to keep memory under 256MB\n- Detailed row-by-row validation error report generated\n- Supports dry-run validation mode before committing changes\n- Processes 10,000 product rows in under 45 seconds", "DONE", "MEDIUM", "usr_samira", "cycle_cp_24", "ms_catalog"),
        ("Implement product collection curation engine with automated query rules", "Create dynamic collections based on product tags, price ranges, and inventory status.\n\n### Acceptance Criteria\n- Dynamic rule builder (e.g. tag = 'summer' AND price < 50)\n- Real-time membership calculation cached in Redis\n- Manual product pinning and sorting order within collection\n- Exposes paginated collection products API for storefront", "DONE", "MEDIUM", "usr_zoe", "cycle_cp_24", "ms_catalog"),
        ("Build inventory visibility rules based on customer location and warehouse stock", "Conditionally display product availability based on customer shipping destination.\n\n### Acceptance Criteria\n- Evaluates regional warehouse stock before showing 'In Stock'\n- Hides products restricted from specific geographic territories\n- Supports 'Ships in 3-5 days from alternate warehouse' status\n- Integrated with storefront geolocation IP header", "IN_PROGRESS", "HIGH", "usr_diego", "cycle_cp_25", "ms_catalog"),
        ("Implement product bundle and kit configuration service with parent/child SKUs", "Support selling bundled merchandise with automatic price and stock rollups.\n\n### Acceptance Criteria\n- Bundle stock dynamically calculated from lowest available child item\n- Line-item breakdown preserved on warehouse picking manifests\n- Supports customizable kits where customers select options\n- Unit test coverage for bundle inventory deduction edge cases", "IN_PROGRESS", "MEDIUM", "usr_carlos", "cycle_cp_25", "ms_catalog"),
        ("Create product badge service (Best Seller, New Arrival, Sale) with TTL triggers", "Automatically compute visual merchandising badges on catalog items.\n\n### Acceptance Criteria\n- 'Sale' badge derived from compare_at_price > price\n- 'New Arrival' badge active for 30 days from creation date\n- 'Best Seller' computed from rolling 30-day order volume\n- Merchant override toggle to force or suppress badges", "IN_PROGRESS", "LOW", "usr_maya", "cycle_cp_25", "ms_catalog"),
        ("Implement customer review and star rating aggregation pipeline", "Collect, moderate, and aggregate product ratings with verified buyer badges.\n\n### Acceptance Criteria\n- Verifies customer purchased product before assigning 'Verified Buyer'\n- Asynchronously updates Bayesian average rating and review counts\n- Profanity filter and spam heuristic moderation queue\n- Schema.org aggregateRating JSON-LD output for SEO", "IN_REVIEW", "MEDIUM", "usr_marcus", "cycle_cp_25", "ms_catalog"),
        ("Build custom product attribute schema validator with JSON Schema", "Allow merchants to define bespoke attribute schemas per category (e.g. Screen Size, Wattage).\n\n### Acceptance Criteria\n- Validates attribute values against merchant JSON Schema definition\n- Supports string, integer, float, boolean, and enum data types\n- Rejects malformed attribute submissions with descriptive field paths\n- Schema changes validated against existing catalog records", "IN_REVIEW", "HIGH", "usr_david", "cycle_cp_25", "ms_catalog"),
        ("Implement brand merchandising landing page layout configurator", "Provide customizable hero banners, featured carousels, and brand story blocks.\n\n### Acceptance Criteria\n- Responsive banner component with mobile aspect ratio overrides\n- Curated product grid linked to brand catalog filters\n- SEO metadata customization per brand landing page\n- Preview mode with draft/published state transition", "TODO", "LOW", "usr_chloe", "cycle_cp_26", "ms_catalog"),
        ("Build product recommendation vector index based on co-purchase history", "Generate related product suggestions using item-to-item collaborative filtering.\n\n### Acceptance Criteria\n- Computes similarity matrix from historical order baskets\n- Suggests complementary items (Frequently Bought Together)\n- Sub-10ms retrieval latency via precomputed Redis tables\n- Fallback to same-category bestsellers when cold-start", "TODO", "HIGH", "usr_nadia", "cycle_cp_26", "ms_catalog"),
        ("Create product SEO metadata generator with automated OpenGraph tags", "Generate structured microdata, canonical links, and social preview tags.\n\n### Acceptance Criteria\n- Generates schema.org/Product JSON-LD with offer and priceValidUntil\n- OpenGraph image preview using optimized product photography\n- Meta description truncated at 155 characters with keyword density\n- Handles canonical URLs for multi-category products", "TODO", "LOW", "usr_sofia", "cycle_cp_26", "ms_catalog"),
        ("Implement catalog Change Data Capture (CDC) publisher to Kafka event topic", "Stream all product database modifications to downstream search and cache workers.\n\n### Acceptance Criteria\n- Debezium PostgreSQL connector streaming to `nexus.catalog.events`\n- Guarantees at-least-once delivery with partition key = productId\n- Emits CREATE, UPDATE, DELETE operation envelopes\n- Monitoring lag alert triggered if CDC consumer lag > 1000 records", "TODO", "URGENT", "usr_tariq", "cycle_cp_26", "ms_catalog"),
        ("Build product archiving and soft-deletion tombstone handler", "Cleanly retire discontinued products without causing 404 dead-ends.\n\n### Acceptance Criteria\n- Sets HTTP 410 Gone or 301 Redirect to parent category\n- Prevents adding archived products to new customer carts\n- Retains variant history for past order inspection\n- Soft-delete flag filter integrated across all active catalog queries", "BACKLOG", "LOW", "usr_zoe", None, "ms_catalog"),
        ("Implement related products association builder with bidirectional links", "Enable manual cross-referencing between products in merchant backoffice.\n\n### Acceptance Criteria\n- Supports Up-Sell, Cross-Sell, and Alternative product relations\n- Bidirectional linking toggle for related pairs\n- Exposes related items in product detail query payload\n- Drag-and-drop reordering of related products", "BACKLOG", "MEDIUM", "usr_chloe", None, "ms_catalog"),
        ("Build digital downloadable product delivery service with signed URLs", "Deliver digital software, ebooks, and licenses upon successful order payment.\n\n### Acceptance Criteria\n- Generates time-limited S3 presigned download URL (24h TTL)\n- Download limit counter per customer license\n- IP address log recorded for every file download\n- File streaming prevents exposing direct S3 bucket credentials", "BACKLOG", "MEDIUM", "usr_samira", None, "ms_catalog"),
        ("Implement multi-currency pricing override table for international storefronts", "Permit fixed market prices rather than raw automated currency conversions.\n\n### Acceptance Criteria\n- Supports fixed price list per ISO currency code (USD, EUR, GBP, JPY)\n- Graceful fallback to daily FX rate if market price omitted\n- Psychological price rounding rule engine (.99, .95 endings)\n- Tax inclusive vs exclusive toggle per currency market", "CANCELLED", "HIGH", "usr_carlos", None, "ms_catalog"),
        ("Finalize catalog indexing integration verification test suite", "Verify that catalog mutations consistently propagate to cache and search within SLA.\n\n### Acceptance Criteria\n- Automated test verifies CDC propagation latency under 1.5 seconds\n- Validates variant stock updates reflect in catalog query immediately\n- Zero stale pricing detected during rapid price update benchmark\n- CI pipeline passes regression run 10 times consecutively", "IN_PROGRESS", "HIGH", "usr_aisha", "cycle_cp_25", "ms_catalog"),
    ],

    # Workstream 3: Search & Discovery (NEX-47 to NEX-68)
    [
        ("Deploy OpenSearch cluster configuration with custom analyzer pipelines", "Provision high-availability OpenSearch cluster with dedicated master and data nodes.\n\n### Acceptance Criteria\n- 3-node cluster with cross-zone replication\n- Custom analyzer pipeline with standard tokenizers and lowercase filters\n- Index template configured with 3 primary shards and 2 replicas\n- CPU and JVM memory monitoring connected to Prometheus", "DONE", "HIGH", "usr_elena", "cycle_cp_23", "ms_search"),
        ("Implement faceted search filtering pipeline for categories, brands, and price", "Build aggregation query generator returning instant filter facet counts.\n\n### Acceptance Criteria\n- Dynamic facet counts reflecting active query and applied filters\n- Multi-select facet aggregation using post-filter technique\n- Range aggregations for price boundaries\n- Query execution time under 15ms on 500,000 product index", "DONE", "HIGH", "usr_nadia", "cycle_cp_23", "ms_search"),
        ("Build real-time catalog search sync worker consuming Kafka product events", "Synchronize product catalog changes into OpenSearch index in near real-time.\n\n### Acceptance Criteria\n- Consumes `nexus.catalog.events` Kafka topic with manual commit\n- Bulk indexing buffer flushing every 500ms or 200 documents\n- Exponential backoff on indexing failure with dead-letter queue\n- Zero lost product updates during simulated consumer crash", "DONE", "HIGH", "usr_nadia", "cycle_cp_23", "ms_search"),
        ("Implement edge ngram autocomplete suggestions with instant typo-tolerance", "Provide instant search query suggestions as the customer types in the search bar.\n\n### Acceptance Criteria\n- Edge-ngram analyzer with min_gram=2, max_gram=15\n- Returns top 5 suggested queries, 3 matching categories, and 4 product previews\n- Typo tolerance with fuzziness=AUTO\n- Response time under 25ms over 4G mobile network", "DONE", "MEDIUM", "usr_marcus", "cycle_cp_24", "ms_search"),
        ("Build synonym dictionary management API for merchant search configuration", "Allow merchants to configure search equivalence terms (e.g., 'sofa' <=> 'couch').\n\n### Acceptance Criteria\n- Supports bidirectional and unidirectional synonym mappings\n- Hot-reload of synonym dictionary without full index reindexing\n- Validates against circular synonym loops\n- Merchant backoffice UI for adding and testing synonym rules", "DONE", "LOW", "usr_nadia", "cycle_cp_24", "ms_search"),
        ("Implement merchant search query merchandising boost and bury rules", "Empower merchandisers to pin specific products to the top of specific search queries.\n\n### Acceptance Criteria\n- Pin item to exact rank position for keyword query\n- Boost specific brand or category score by custom multiplier\n- Bury out-of-stock items to bottom of search results\n- Rule scheduling with start and expiration dates", "DONE", "HIGH", "usr_nadia", "cycle_cp_24", "ms_search"),
        ("Build zero-result fallback recommender with popular search trending queries", "Provide helpful alternative recommendations when customer query yields no matches.\n\n### Acceptance Criteria\n- Renders top trending products and popular search terms on empty results\n- Suggests spelling correction ('Did you mean: ...')\n- Logs zero-result search terms to merchant analytics pipeline\n- Zero blank page drop-offs recorded in analytics", "DONE", "MEDIUM", "usr_maya", "cycle_cp_24", "ms_search"),
        ("Implement multi-lingual search analyzer supporting Spanish, French, and German", "Deploy language-specific stemmers and stop-word filters for international markets.\n\n### Acceptance Criteria\n- Integrates Snowball stemmers for Spanish, French, and German\n- Locale-specific decompounding for German compound words\n- Language routing based on storefront active locale header\n- Relevance benchmarks show 30% increase in international recall", "IN_PROGRESS", "MEDIUM", "usr_nadia", "cycle_cp_25", "ms_search"),
        ("Create search query telemetry pipeline tracking click-through rate (CTR)", "Track user search interactions to evaluate and optimize ranking algorithms.\n\n### Acceptance Criteria\n- Emits `SEARCH_QUERY_PERFORMED` and `SEARCH_RESULT_CLICKED` events\n- Correlates search query ID with subsequent product page views\n- Aggregates Mean Reciprocal Rank (MRR) metric daily\n- Anonymizes IP addresses in compliance with privacy regulations", "IN_PROGRESS", "MEDIUM", "usr_samira", "cycle_cp_25", "ms_search"),
        ("Build visual search embedding service using CLIP image vectors", "Allow customers to upload an image and find visually similar catalog merchandise.\n\n### Acceptance Criteria\n- Extracts 512-dimensional vector embedding using CLIP ViT-B/32\n- K-Nearest Neighbors (kNN) index search in OpenSearch\n- Cosine similarity threshold filters out low-confidence matches\n- Inference latency under 200ms on GPU worker pool", "IN_PROGRESS", "HIGH", "usr_nadia", "cycle_cp_25", "ms_search"),
        ("Implement voice search phonetic query normalizer using Double Metaphone", "Handle voice dictation transcriptions and phonetic misspellings cleanly.\n\n### Acceptance Criteria\n- Phonetic filter indexes sounds-like representations of brand names\n- Matches spoken queries with high acoustic variance\n- Normalizes voice punctuation and speech artifacts\n- User testing shows 40% accuracy improvement on voice queries", "IN_REVIEW", "LOW", "usr_marcus", "cycle_cp_25", "ms_search"),
        ("Build dynamic price range histogram aggregation for storefront sidebar", "Compute price distribution buckets matching active search filter criteria.\n\n### Acceptance Criteria\n- Computes 10 proportional price intervals dynamically\n- Min and max price slider bounds update with filtered inventory\n- Zero empty buckets rendered in UI\n- Performance benchmark shows sub-8ms aggregation response", "IN_REVIEW", "MEDIUM", "usr_jordan", "cycle_cp_25", "ms_search"),
        ("Implement search result pagination with deterministic tie-breaking sorting", "Prevent duplicate or missing products when customers navigate paginated results.\n\n### Acceptance Criteria\n- Sorts by score, then createdAt DESC, then productId ASC for tie-breaking\n- Supports both cursor-based search_after and offset pagination\n- Validates deep pagination performance up to page 50\n- Clean URL query param serialization (`?page=2&sort=price_asc`)", "TODO", "MEDIUM", "usr_sofia", "cycle_cp_26", "ms_search"),
        ("Build recent search history cache for authenticated and guest users", "Store and display recent search keywords in customer search dropdown.\n\n### Acceptance Criteria\n- Stores up to 10 recent searches per user in localStorage and Redis\n- Provides 'Clear Search History' action in dropdown\n- Synchronizes guest search history upon account login\n- Privacy controls allow customers to disable search history", "TODO", "LOW", "usr_jordan", "cycle_cp_26", "ms_search"),
        ("Implement search spellchecker with Levenshtein distance candidate scoring", "Offer intelligent spelling corrections for mistyped search keywords.\n\n### Acceptance Criteria\n- Suggests single-term and multi-term candidate corrections\n- Maximum Levenshtein distance of 2 edits\n- Candidates weighted by catalog term frequency\n- 'Did you mean' banner click rate tracked in analytics", "TODO", "MEDIUM", "usr_nadia", "cycle_cp_26", "ms_search"),
        ("Create search indexing backfill script for zero-downtime index reindexing", "Rebuild entire search index from database without interrupting live customer queries.\n\n### Acceptance Criteria\n- Creates new target index with updated mapping definitions\n- Streams all products using cursor batching\n- Switches OpenSearch index alias atomically upon completion\n- Deletes old index after health verification", "TODO", "HIGH", "usr_elena", "cycle_cp_26", "ms_search"),
        ("Implement search query caching layer using Redis with 60-second TTL", "Cache top 1,000 frequent search queries to reduce OpenSearch cluster workload.\n\n### Acceptance Criteria\n- Generates cache key from normalized query string and active filter params\n- TTL set to 60 seconds with cache stampede protection via mutex lock\n- Cache hit ratio exceeds 65% during peak holiday simulation\n- Selective cache invalidation on major catalog updates", "BACKLOG", "MEDIUM", "usr_nadia", None, "ms_search"),
        ("Build merchant top-searched keywords analytics report in backoffice", "Provide merchants with actionable visibility into customer search behavior.\n\n### Acceptance Criteria\n- Lists top 100 queries by search volume over 7, 30, and 90 days\n- Displays conversion rate and average order value per search term\n- Highlights high-volume queries yielding zero results\n- Export report to CSV and Excel formats", "BACKLOG", "LOW", "usr_samira", None, "ms_search"),
        ("Implement search filter multi-select aggregation with disjunctive faceting", "Ensure selecting a filter option does not collapse other options in the same group.\n\n### Acceptance Criteria\n- Disjunctive faceting preserves counts for non-selected options in same facet\n- Filter state serialized cleanly in URL parameters\n- Handles concurrent selection of 5+ filter dimensions\n- Comprehensive automated tests verify facet count accuracy", "BACKLOG", "HIGH", "usr_jordan", None, "ms_search"),
        ("Build custom filter sorting by product attribute order in catalog", "Allow merchants to control display order of filter facet values (e.g., XS, S, M, L, XL).\n\n### Acceptance Criteria\n- Custom sort order defined in category attribute settings\n- Fallback to count descending if custom order not defined\n- Correct alphanumeric sorting for numeric sizes (7, 7.5, 8, 8.5)\n- Storefront sidebar reflects custom order precisely", "CANCELLED", "LOW", "usr_maya", None, "ms_search"),
        ("Audit search latency benchmarks under 5,000 concurrent query load", "Benchmark OpenSearch query latency under simulated high-traffic peak conditions.\n\n### Acceptance Criteria\n- p95 latency remains under 35ms at 5,000 requests/second\n- CPU utilization across cluster nodes stays below 70%\n- Zero dropped connections or 5xx gateway errors\n- Full load test report archived in engineering wiki", "IN_PROGRESS", "URGENT", "usr_devon", "cycle_cp_25", "ms_search"),
        ("Finalize storefront search box component and keyboard navigation shortcuts", "Build accessible search modal with full keyboard arrow navigation and Escape handling.\n\n### Acceptance Criteria\n- Opens on `/` keyboard shortcut from anywhere on storefront\n- Up/Down arrow keys highlight suggestions with instant preview\n- Screen reader accessible with ARIA live region updates\n- Mobile responsive drawer with auto-focusing input field", "DONE", "MEDIUM", "usr_marcus", "cycle_cp_24", "ms_search"),
    ],

    # Workstream 4: Cart & Checkout (NEX-69 to NEX-92)
    [
        ("Implement distributed cart state machine with optimistic concurrency control", "Manage customer cart state with atomic version incrementing preventing race conditions.\n\n### Acceptance Criteria\n- Version column checked on every cart mutation\n- Conflict triggers re-fetch and transparent re-calculation\n- Cart items stored with SKU, quantity, unit price snapshot, and options\n- Unit test coverage for concurrent quantity update requests", "DONE", "URGENT", "usr_david", "cycle_cp_24", "ms_checkout"),
        ("Build server-side cart pricing calculation engine with tax and shipping previews", "Recalculate subtotal, discounts, estimated tax, and shipping on every cart update.\n\n### Acceptance Criteria\n- Deterministic rounding to 2 decimal places using Banker's Rounding\n- Computes line-item discounts and cart-level promotional adjustments\n- Provides estimated tax based on customer postal code\n- Response payload includes breakdown for UI transparency", "DONE", "HIGH", "usr_carlos", "cycle_cp_24", "ms_checkout"),
        ("Implement promotional coupon discount validator with usage limit guards", "Validate promotional discount codes against customer eligibility and usage limits.\n\n### Acceptance Criteria\n- Checks minimum order value threshold and category restrictions\n- Enforces global usage limit and per-customer usage limit\n- Prevents stacking non-combinable coupon promotions\n- Returns user-friendly validation error message on rejected codes", "DONE", "HIGH", "usr_carlos", "cycle_cp_24", "ms_checkout"),
        ("Build guest checkout session migration to authenticated customer profile", "Transfer guest cart items and addresses to customer account upon login during checkout.\n\n### Acceptance Criteria\n- Merges guest cart items with existing customer cart items\n- Resolves duplicate SKU quantities without exceeding stock limits\n- Migrates guest shipping address to customer address book\n- Invalidates old guest session token to prevent session hijacking", "DONE", "MEDIUM", "usr_alex", "cycle_cp_24", "ms_checkout"),
        ("Implement address validation and normalization service using Google Places API", "Verify customer shipping and billing addresses against standardized postal databases.\n\n### Acceptance Criteria\n- Autocompletes address street names with Google Places API\n- Suggests standardized postal address corrections\n- Detects undeliverable addresses and prompts customer confirmation\n- Caches verified addresses to minimize external API costs", "DONE", "MEDIUM", "usr_diego", "cycle_cp_24", "ms_checkout"),
        ("Build multi-step checkout state machine (Shipping -> Delivery -> Payment -> Review)", "Orchestrate customer progression through checkout stages with strict prerequisite validation.\n\n### Acceptance Criteria\n- Cannot proceed to Payment without validated Shipping address\n- Cannot submit order without valid Payment authorization\n- Back button preserves all entered customer form inputs\n- State transitions validated on server before granting stage progression", "DONE", "URGENT", "usr_david", "cycle_cp_24", "ms_checkout"),
        ("Implement temporary inventory reservation during checkout session TTL", "Hold merchandise inventory for 15 minutes while customer completes payment details.\n\n### Acceptance Criteria\n- Acquires inventory hold upon entering Payment step\n- 15-minute countdown timer displayed to customer in UI\n- Automatically releases hold on cart abandonment or timeout\n- Prevents overselling popular drop items", "DONE", "URGENT", "usr_diego", "cycle_cp_24", "ms_checkout"),
        ("Build 1-click Express Checkout flow with Apple Pay and Google Pay integration", "Enable streamlined purchase bypassing manual address and credit card entry.\n\n### Acceptance Criteria\n- Requests shipping address and email directly from Apple/Google Pay wallet\n- Dynamically recalculates shipping rates based on wallet address\n- Processes payment token in single atomic transaction\n- Completes purchase in under 3 taps on mobile device", "IN_PROGRESS", "HIGH", "usr_jordan", "cycle_cp_25", "ms_checkout"),
        ("Implement real-time line item quantity adjustment with debounce synchronization", "Allow customers to adjust quantities in cart drawer with fluid UI responsiveness.\n\n### Acceptance Criteria\n- 300ms debounce on quantity stepper buttons\n- Optimistic UI update with rollback if server rejects quantity\n- Disables increment button when item reaches inventory limit\n- Screen reader announces updated item quantity and new subtotal", "IN_PROGRESS", "MEDIUM", "usr_chloe", "cycle_cp_25", "ms_checkout"),
        ("Build gift card balance lookup and split-tender payment calculation", "Support applying store gift cards with remaining balance charged to credit card.\n\n### Acceptance Criteria\n- Encrypted gift card PIN verification\n- Deducts maximum available gift card balance against cart total\n- Computes remaining balance for primary payment method\n- Handles refund reversal prioritising gift card re-credit", "IN_PROGRESS", "MEDIUM", "usr_priya", "cycle_cp_25", "ms_checkout"),
        ("Implement shipping method selection with dynamic carrier delivery estimates", "Display available delivery tiers (Standard, Expedited, Overnight) with live pricing.\n\n### Acceptance Criteria\n- Fetches carrier shipping rates based on parcel weight and destination\n- Displays estimated delivery date range (e.g. 'Arrives Thu, Oct 15 - Fri, Oct 16')\n- Highlights free shipping qualification threshold\n- Fallback to flat-rate table on carrier API failure", "IN_PROGRESS", "HIGH", "usr_diego", "cycle_cp_25", "ms_checkout"),
        ("Build customer order notes and gift message attachment service", "Allow customers to include custom packaging notes and gift recipient messages.\n\n### Acceptance Criteria\n- 250 character limit on gift message with live character counter\n- Sanitizes inputs to prevent script injection\n- Formats gift message onto warehouse packing slip template\n- Stores notes in order metadata JSONB column", "IN_REVIEW", "LOW", "usr_chloe", "cycle_cp_25", "ms_checkout"),
        ("Implement checkout abandonment webhook trigger for marketing automation", "Notify marketing systems when customer leaves cart without completing checkout.\n\n### Acceptance Criteria\n- Triggers 60 minutes after last checkout activity\n- Includes customer email, cart contents, and recovery URL link\n- Omits trigger if customer completed another order in interim\n- Webhook signed with HMAC secret for Klaviyo integration", "IN_REVIEW", "MEDIUM", "usr_samira", "cycle_cp_25", "ms_checkout"),
        ("Build tax calculation adapter integrating with TaxJar and Avalara AvaTax", "Calculate accurate sales tax including state, county, and municipal jurisdictions.\n\n### Acceptance Criteria\n- Sends line items, product tax codes, and destination address\n- Handles product-specific exemptions (e.g. clothing in NY/NJ)\n- Caches tax rates per 5-digit ZIP code for 24 hours\n- Fallback to safe municipal estimate if tax provider times out (>2s)", "IN_REVIEW", "HIGH", "usr_carlos", "cycle_cp_25", "ms_checkout"),
        ("Implement regional VAT reverse-charge calculation for B2B European orders", "Validate EU VAT registration numbers and apply zero-rate tax on cross-border B2B sales.\n\n### Acceptance Criteria\n- Validates VAT ID in real-time against VIES database\n- Applies 0% reverse charge VAT when buyer is in different EU country\n- Retains VIES consultation number on invoice for tax audit\n- Falls back to standard domestic VAT if VIES service unreachable", "TODO", "HIGH", "usr_artur", "cycle_cp_26", "ms_checkout"),
        ("Build cross-sell and upsell merchandising recommendations within cart drawer", "Suggest complementary low-cost add-on merchandise directly in sliding cart drawer.\n\n### Acceptance Criteria\n- Recommends products priced under $25 matching cart categories\n- One-click 'Add to Cart' button without leaving drawer view\n- Suppresses items already present in active cart\n- Tracks add-to-cart conversion rate for merchandiser review", "TODO", "LOW", "usr_maya", "cycle_cp_26", "ms_checkout"),
        ("Implement cart item expiration and automatic return to inventory pool", "Reclaim abandoned cart reservations to keep catalog stock accurate.\n\n### Acceptance Criteria\n- Background worker runs every 2 minutes scanning expired cart holds\n- Releases Redis Redlock inventory reservation\n- Displays polite 'Item removed due to inactivity' message to returning user\n- Retains non-reserved items in cart for customer convenience", "TODO", "MEDIUM", "usr_diego", "cycle_cp_26", "ms_checkout"),
        ("Build localized currency display and formatting utility in checkout review", "Format order currency according to international locale standards.\n\n### Acceptance Criteria\n- Formats currency symbols, decimal separators, and grouping symbols correctly\n- Handles zero-decimal currencies (JPY, KRW) accurately\n- Respects customer language and country display conventions\n- Tested across 35 international currency configurations", "TODO", "LOW", "usr_sofia", "cycle_cp_26", "ms_checkout"),
        ("Implement checkout form client-side validation with zero layout shift", "Validate address and payment fields inline without causing jarring page jumps.\n\n### Acceptance Criteria\n- Instant feedback on blur with clear error messages\n- Inline error icons and red border highlights compliant with accessibility\n- Retains form scroll position on validation trigger\n- Disables submit button until all required fields pass validation", "TODO", "MEDIUM", "usr_marcus", "cycle_cp_26", "ms_checkout"),
        ("Build checkout idempotency key enforcement to prevent duplicate submissions", "Guarantee that customer double-clicking 'Place Order' only charges once.\n\n### Acceptance Criteria\n- Generates UUID v4 idempotency key per checkout attempt\n- API gateway caches response for key in Redis for 120 seconds\n- Second request returns cached response immediately with 200 OK\n- Prevents duplicate credit card charges and duplicate order creations", "BACKLOG", "URGENT", "usr_david", None, "ms_checkout"),
        ("Implement express re-order flow from customer previous purchase history", "Allow customers to re-purchase previous orders with one click.\n\n### Acceptance Criteria\n- Verifies current availability and pricing for all items from past order\n- Notifies customer if any items are discontinued or out of stock\n- Populates cart and redirects directly to checkout review step\n- Retains customer original shipping address choice as default", "BACKLOG", "LOW", "usr_chloe", None, "ms_checkout"),
        ("Build checkout error recovery screen with contextual retry guidance", "Display actionable recovery steps when payment or inventory validation fails.\n\n### Acceptance Criteria\n- Clear error description (e.g. 'Card Declined: Insufficient Funds')\n- Offers alternative payment method selection without losing entered data\n- Highlights out-of-stock items with one-click removal option\n- Contact customer support shortcut with pre-filled error correlation ID", "BACKLOG", "MEDIUM", "usr_maya", None, "ms_checkout"),
        ("Audit cart and checkout accessibility compliance (WCAG 2.1 AA)", "Audit checkout screens with axe-core and screen readers ensuring full AA compliance.\n\n### Acceptance Criteria\n- All form inputs have explicit `<label>` associations\n- Color contrast ratio exceeds 4.5:1 on all text and button elements\n- Error announcements read aloud by VoiceOver and NVDA\n- Zero keyboard traps throughout entire checkout sequence", "CANCELLED", "HIGH", "usr_aisha", None, "ms_checkout"),
        ("Finalize storefront responsive checkout UI integration and smoke tests", "Verify checkout flow across desktop, tablet, and mobile viewport breakpoints.\n\n### Acceptance Criteria\n- Single column layout on viewports < 768px; split view on desktop\n- Order summary sticky sidebar remains readable during long scrolls\n- Synthetic checkout smoke tests pass on iOS Safari and Android Chrome\n- Zero horizontal scrollbars at 390px mobile viewport", "IN_PROGRESS", "MEDIUM", "usr_marcus", "cycle_cp_25", "ms_checkout"),
    ],

    # Workstream 5: Payments & Refunds (NEX-93 to NEX-118)
    [
        ("Implement unified Payment Intent API orchestrating multi-gateway routing", "Abstract underlying payment processors behind canonical Payment Intent interface.\n\n### Acceptance Criteria\n- Unified lifecycle: CREATED -> REQUIRES_ACTION -> PROCESSING -> SUCCEEDED -> FAILED\n- Decouples checkout frontend from gateway-specific SDKs\n- Routes to optimal gateway based on currency, amount, and merchant rules\n- Sub-50ms execution overhead in payment gateway orchestrator", "DONE", "URGENT", "usr_priya", "cycle_cp_24", "ms_payments"),
        ("Build Stripe Elements credit card tokenization form with secure iframe isolation", "Integrate Stripe Payment Element ensuring merchant servers never touch raw PANs.\n\n### Acceptance Criteria\n- Renders in secure PCI-compliant iframe\n- Dynamic styling matching NEXUS design system typography and colors\n- Client-side tokenization producing secure `pm_` payment method token\n- Handles automatic postal code verification matching billing country", "DONE", "HIGH", "usr_priya", "cycle_cp_24", "ms_payments"),
        ("Implement Adyen payment processing adapter for European payment methods (iDEAL, Sofort)", "Support direct bank transfer payment methods popular in European markets.\n\n### Acceptance Criteria\n- Integrates Adyen Drop-in component with redirect flow handling\n- Supports iDEAL, Sofort, Bancontact, and Giropay\n- Webhook listener verifies HMAC-SHA256 signature from Adyen\n- Reconciles async payment settlement notifications", "DONE", "HIGH", "usr_kevin", "cycle_cp_24", "ms_payments"),
        ("Build Apple Pay and Google Pay server-side decryption and token processor", "Process biometric mobile wallet tokens through merchant payment gateway.\n\n### Acceptance Criteria\n- Validates merchant domain verification file with Apple Developer\n- Decrypts Apple Pay PKPaymentToken using merchant KMS private key\n- Submits network token to payment processor with cryptogram\n- Zero raw card numbers decrypted in application log streams", "DONE", "HIGH", "usr_priya", "cycle_cp_24", "ms_payments"),
        ("Implement 3D-Secure 2.0 biometric challenge modal and friction-free flow", "Support PSD2 Strong Customer Authentication (SCA) with dynamic challenge iframe.\n\n### Acceptance Criteria\n- Detects when gateway requires 3DS challenge action\n- Renders responsive challenge modal overlay\n- Completes authentication and captures payment without full page reload\n- Supports frictionless flow for low-risk transactions", "DONE", "URGENT", "usr_priya", "cycle_cp_24", "ms_payments"),
        ("Build automated fraud risk scoring engine with velocity checks and MaxMind IP", "Score transaction risk before submitting authorization to payment gateway.\n\n### Acceptance Criteria\n- Evaluates card testing velocity (max 3 attempts per IP per hour)\n- Checks billing country vs IP geolocation country match\n- Assigns risk score 0-100; scores > 75 trigger 3DS or manual review\n- Execution completes in under 20ms before payment authorization", "DONE", "HIGH", "usr_owen", "cycle_cp_24", "ms_payments"),
        ("Implement two-step payment authorization and delayed capture pipeline", "Authorize funds at checkout and capture upon warehouse order fulfillment.\n\n### Acceptance Criteria\n- Auth holds customer funds for up to 7 days\n- Capture API triggered when warehouse marks parcel shipped\n- Supports capturing lesser amount if line item was cancelled\n- Automatically voids expired authorizations after 7 days", "DONE", "HIGH", "usr_kevin", "cycle_cp_24", "ms_payments"),
        ("Build asynchronous refund processing state machine with partial amount support", "Process customer refunds against original payment methods with status tracking.\n\n### Acceptance Criteria\n- States: REQUESTED -> PROCESSING -> SETTLED -> FAILED\n- Supports multiple partial refunds up to total order captured amount\n- Records refund reason code (Customer Return, Damaged, Out of Stock)\n- Dispatches refund confirmation webhook to customer notification service", "DONE", "HIGH", "usr_priya", "cycle_cp_24", "ms_payments"),
        ("Implement webhook ingestion handler for payment gateway status updates", "Process asynchronous gateway callbacks with idempotent event recording.\n\n### Acceptance Criteria\n- Verifies webhook cryptographic signature header\n- Deduplicates events using gateway event ID in Redis\n- Updates order payment status and logs audit event\n- Responds with HTTP 200 within 500ms; processes business logic asynchronously", "DONE", "URGENT", "usr_kevin", "cycle_cp_24", "ms_payments"),
        ("Build payment ledger double-entry bookkeeping service for financial audit", "Maintain immutable balance ledger of merchant debits, credits, and fees.\n\n### Acceptance Criteria\n- Every transaction records equal and offsetting debit/credit entries\n- Accounts for gross sales, merchant processor fees, tax, and net payout\n- Immutable append-only ledger schema with cryptographic hashing\n- Balance reconciliation report balances to 0 variance daily", "IN_PROGRESS", "HIGH", "usr_felix", "cycle_cp_25", "ms_payments"),
        ("Implement credit card expiration warning and automatic card updater service", "Keep saved customer payment cards active upon expiration.\n\n### Acceptance Criteria\n- Subscribes to Visa Account Updater (VAU) and Mastercard ABN services\n- Automatically updates card expiration and token on file\n- Sends polite email to customer 30 days before un-updatable card expires\n- Reduces subscription payment churn by estimated 25%", "IN_PROGRESS", "LOW", "usr_kevin", "cycle_cp_25", "ms_payments"),
        ("Build chargeback and payment dispute notification webhook processor", "Handle bank dispute notifications and collect evidence documentation.\n\n### Acceptance Criteria\n- Alerts merchant administrators immediately upon dispute creation\n- Automatically places related customer account on security hold\n- Uploads delivery confirmation and signature proof to gateway evidence portal\n- Tracks dispute win/loss ratio in merchant risk dashboard", "IN_PROGRESS", "HIGH", "usr_owen", "cycle_cp_25", "ms_payments"),
        ("Implement PayPal Commerce Platform checkout integration with smart buttons", "Provide PayPal and Venmo payment options in checkout payment drawer.\n\n### Acceptance Criteria\n- Loads PayPal JavaScript SDK dynamically only when user views payment\n- Captures PayPal order ID and stores in Payment Intent metadata\n- Supports PayPal Pay in 4 installment option\n- Reconciles PayPal async webhook IPN notifications", "IN_PROGRESS", "MEDIUM", "usr_priya", "cycle_cp_25", "ms_payments"),
        ("Build Klarna and Afterpay Buy-Now-Pay-Later (BNPL) installment provider", "Offer flexible 4-installment payment plans for orders between $35 and $1,000.\n\n### Acceptance Criteria\n- Displays estimated installment price preview on product and cart pages\n- Initiates BNPL session and verifies customer credit approval\n- Merchant receives full funding immediately; provider manages customer collections\n- Handles BNPL partial return and refund calculations", "IN_REVIEW", "MEDIUM", "usr_priya", "cycle_cp_25", "ms_payments"),
        ("Implement payment gateway failover logic upon transient provider outage", "Automatically switch to secondary payment gateway if primary gateway errors spike.\n\n### Acceptance Criteria\n- Circuit breaker trips when primary gateway error rate exceeds 5% over 1 min\n- Seamlessly reroutes subsequent payment authorizations to backup provider\n- Automatically tests primary gateway recovery every 60 seconds\n- Alerts on-call engineering team via PagerDuty on failover event", "IN_REVIEW", "URGENT", "usr_vikram", "cycle_cp_25", "ms_payments"),
        ("Build PCI-DSS Level 1 compliant card token vault with KMS envelope encryption", "Secure customer credit card tokens in dedicated encrypted database.\n\n### Acceptance Criteria\n- AES-256-GCM envelope encryption using AWS KMS customer master key\n- Tokens isolated in dedicated VPC with zero external ingress\n- Access restricted to automated payment worker IAM role\n- Annual third-party QSA audit compliance certification package", "IN_REVIEW", "URGENT", "usr_vikram", "cycle_cp_25", "ms_payments"),
        ("Implement merchant payout calculation and daily settlement batch exporter", "Calculate net merchant funds available for daily ACH bank transfer.\n\n### Acceptance Criteria\n- Aggregates settled transactions minus refunds, disputes, and platform fees\n- Holds rolling reserve for high-risk merchant accounts\n- Generates NACHA ACH formatted transfer file for banking partner\n- Reconciliation report verifies total payout matches ledger balance", "TODO", "HIGH", "usr_felix", "cycle_cp_26", "ms_payments"),
        ("Build customer saved payment methods management portal in account settings", "Allow customers to view, delete, and set default saved payment cards.\n\n### Acceptance Criteria\n- Displays card brand icon, last 4 digits, and expiration date\n- Set default payment method for 1-click purchases\n- Delete saved card removes token from payment gateway vault\n- Requires password re-entry before managing saved payment methods", "TODO", "MEDIUM", "usr_marcus", "cycle_cp_26", "ms_payments"),
        ("Implement currency exchange rate settlement lock for international purchases", "Lock foreign exchange conversion rate during checkout to prevent settlement drift.\n\n### Acceptance Criteria\n- Fixes FX rate for 15 minutes during checkout session\n- Absorbs or gains fractional currency fluctuations in platform fee ledger\n- Discloses guaranteed exchange rate clearly to international customer\n- Supports multi-currency merchant bank accounts", "TODO", "LOW", "usr_felix", "cycle_cp_26", "ms_payments"),
        ("Build payment retry scheduler for failed subscription and recurring billings", "Intelligently retry failed card charges using smart retry heuristics.\n\n### Acceptance Criteria\n- Retries failed card 4 times across 14-day schedule\n- Analyzes bank decline codes; retries soft declines (Insufficent Funds) on paydays\n- Immediately suspends service on hard declines (Stolen Card)\n- Customer notified with secure link to update payment method", "TODO", "MEDIUM", "usr_kevin", "cycle_cp_26", "ms_payments"),
        ("Implement automated refund receipt generation and PDF download link", "Generate branded PDF receipt confirming refund amount and card credited.\n\n### Acceptance Criteria\n- Formats refund transaction ID, date, amount, and original order number\n- Uploads encrypted PDF to private customer document storage\n- Included as download link in refund confirmation email\n- Compliant with EU consumer protection invoicing regulations", "BACKLOG", "LOW", "usr_chloe", None, "ms_payments"),
        ("Build payment gateway latency metrics and error rate Prometheus exporter", "Export real-time payment gateway performance metrics to Grafana.\n\n### Acceptance Criteria\n- Exposes gateway authorization latency histogram buckets (p50, p95, p99)\n- Tracks decline code distribution counters (Do Not Honor, Fraud, Insufficient Funds)\n- Alert triggers if payment p95 latency exceeds 1,800ms\n- Dashboards partitioned by payment provider and merchant region", "BACKLOG", "MEDIUM", "usr_elena", None, "ms_payments"),
        ("Implement merchant custom fraud rules engine with CIDR blocklists", "Allow merchants to configure custom risk rules and blocked IP ranges.\n\n### Acceptance Criteria\n- Block purchases from specified email domains or free webmail\n- Enforce maximum transaction amount for first-time buyers\n- Block known high-risk IP subnets and VPN exit nodes\n- Real-time simulation tool to test rules against past transaction logs", "BACKLOG", "MEDIUM", "usr_owen", None, "ms_payments"),
        ("Build manual payment capture review dashboard for high-risk flagged orders", "Provide fraud analysts with queue to inspect and approve flagged transactions.\n\n### Acceptance Criteria\n- Lists orders held for manual review with risk breakdown details\n- One-click 'Approve & Capture' or 'Reject & Void' buttons\n- Displays customer historical order count and chargeback record\n- Automated expiration voids authorization after 48 hours without action", "BACKLOG", "HIGH", "usr_miriam", None, "ms_payments"),
        ("Audit end-to-end payment idempotency under simulated network timeouts", "Simulate dropped TCP connections during payment capture to verify zero duplicate charges.\n\n### Acceptance Criteria\n- Chaos proxy injects 20% timeout rate between gateway and orchestrator\n- Validates orchestrator retries with identical idempotency key\n- Zero duplicate charges verified across 5,000 synthetic test transactions\n- Detailed audit report submitted to compliance officer", "CANCELLED", "URGENT", "usr_vikram", None, "ms_payments"),
        ("Finalize payment gateway regression testing suite against sandbox accounts", "Comprehensive automated test suite validating all gateways across edge cases.\n\n### Acceptance Criteria\n- Tests successful authorizations, declines, 3DS challenges, and refunds\n- Covers Stripe, Adyen, PayPal, and Apple Pay sandbox mocks\n- Runs automatically on pull request merge to main branch\n- All 85 test assertions pass in under 45 seconds", "IN_PROGRESS", "HIGH", "usr_aisha", "cycle_cp_25", "ms_payments"),
    ],

    # Workstream 6: Orders & Returns (NEX-119 to NEX-142)
    [
        ("Implement distributed Order lifecycle state machine (PENDING, PAID, PROCESSING, FULFILLED)", "Build core order state transitions enforced by domain validation guards.\n\n### Acceptance Criteria\n- Allowed transitions: PENDING -> PAID -> PROCESSING -> FULFILLED -> COMPLETED\n- Cancelled allowed from PENDING, PAID, or PROCESSING\n- Invalid state transition throws domain exception\n- Emits `ORDER_STATE_CHANGED` event on every valid transition", "DONE", "URGENT", "usr_david", "cycle_cp_24", "ms_fulfillment"),
        ("Build transactional order creation coordinator with database commit rollback", "Coordinate cart consumption, inventory reservation, and order record creation in single transaction.\n\n### Acceptance Criteria\n- Atomic PostgreSQL transaction commits order and line items together\n- Automatic rollback if inventory deduction fails\n- Decrements cart item count upon order creation\n- Execution completes in under 25ms", "DONE", "HIGH", "usr_david", "cycle_cp_24", "ms_fulfillment"),
        ("Implement order sequence number generator with customizable merchant prefixes", "Generate friendly order numbers (e.g., `#NEX-10492`) with sequential monotonicity.\n\n### Acceptance Criteria\n- PostgreSQL sequence generator guarantees no duplicate numbers under concurrency\n- Customizable merchant prefix and zero-padding length\n- Obfuscates total order volume to prevent competitor scraping\n- High-speed generation under 1ms per order", "DONE", "LOW", "usr_zoe", "cycle_cp_24", "ms_fulfillment"),
        ("Build customer order history search and detail view API", "Allow customers to search and inspect their previous purchases.\n\n### Acceptance Criteria\n- Filters by date range, order status, and item keyword\n- Returns detailed pricing breakdown, tracking numbers, and delivery status\n- Paginated API with sub-10ms response time on 50+ order history\n- Scoped strictly to authenticated customer ID", "DONE", "MEDIUM", "usr_carlos", "cycle_cp_24", "ms_fulfillment"),
        ("Implement customer self-service order cancellation within 30-minute grace window", "Allow customers to cancel orders before warehouse processing begins.\n\n### Acceptance Criteria\n- Cancel button visible for 30 minutes following order placement\n- Voids payment authorization immediately\n- Releases inventory holds back to catalog availability\n- Sends order cancellation email receipt to customer", "DONE", "MEDIUM", "usr_chloe", "cycle_cp_24", "ms_fulfillment"),
        ("Build customer self-service returns portal with automated RMA creation", "Empower customers to initiate merchandise returns and select return reasons.\n\n### Acceptance Criteria\n- Validates items within 30-day return eligibility window\n- Customer selects items to return and reason (Wrong Size, Defective, Changed Mind)\n- Generates unique Return Merchandise Authorization (RMA) tracking number\n- Updates order return status to `RETURN_REQUESTED`", "DONE", "HIGH", "usr_marcus", "cycle_cp_24", "ms_fulfillment"),
        ("Implement return label generation with QR code drop-off for postal carriers", "Generate digital return shipping labels and paperless carrier QR codes.\n\n### Acceptance Criteria\n- Generates USPS / FedEx prepaid return shipping label\n- Generates carrier QR code printable or scannable at retail post office\n- Deducts return shipping fee from pending refund amount if merchant policy mandates\n- Emails return label and packing instructions to customer", "IN_PROGRESS", "HIGH", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Build return inspection and grading workflow for warehouse receiving staff", "Enable warehouse operators to inspect returned items and log physical condition.\n\n### Acceptance Criteria\n- Barcode scan of RMA pulls up expected return items on mobile terminal\n- Staff grades condition: Brand New, Restockable Open Box, Damaged/Scrap\n- Approving inspection triggers automatic refund issuance\n- Photo upload capability to document customer return damage", "IN_PROGRESS", "MEDIUM", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Implement automated restocking fee deduction and return shipping fee calculation", "Compute net refund amount after applicable return fees.\n\n### Acceptance Criteria\n- Deducts configurable restocking percentage (e.g. 15% on electronics)\n- Waives return fee if item was marked defective by customer\n- Displays detailed fee deduction breakdown on customer return confirmation\n- Net amount passed directly to payment refund state machine", "IN_PROGRESS", "MEDIUM", "usr_carlos", "cycle_cp_25", "ms_fulfillment"),
        ("Build order item modification and split order coordinator for backorders", "Split orders when partial inventory is ready for immediate dispatch.\n\n### Acceptance Criteria\n- Splits original order into Order-A (Shipped) and Order-B (Backordered)\n- Prorates captured payment and shipping fees proportionally\n- Generates independent tracking numbers and packing slips\n- Customer portal shows unified order relationship with separate shipments", "IN_PROGRESS", "HIGH", "usr_david", "cycle_cp_25", "ms_fulfillment"),
        ("Implement customer invoice generation with printable PDF and tax summary", "Generate formal invoice documents matching international tax compliance standards.\n\n### Acceptance Criteria\n- Renders merchant logo, business address, and VAT/Tax ID numbers\n- Itemized line items with unit price, discounts, and jurisdictional tax rates\n- PDF generated in under 350ms using headless Chrome printer service\n- Available for customer download in order details page", "IN_REVIEW", "LOW", "usr_marcus", "cycle_cp_25", "ms_fulfillment"),
        ("Build order fulfillment status webhook dispatcher for external ERPs", "Broadcast order lifecycle events to third-party ERP and warehouse systems.\n\n### Acceptance Criteria\n- Emits webhooks for `ORDER_PAID`, `ORDER_FULFILLED`, `ORDER_CANCELLED`\n- JSON payload formatted to standard OpenCommerce schema\n- HMAC signature verification header for recipient security\n- Automatic retry with exponential backoff up to 72 hours on 5xx errors", "IN_REVIEW", "HIGH", "usr_tariq", "cycle_cp_25", "ms_fulfillment"),
        ("Implement order timeline event history logger tracking all customer touchpoints", "Record chronological log of all actions affecting an order for customer support.\n\n### Acceptance Criteria\n- Records order placed, payment captured, labels printed, out for delivery, delivered\n- Tracks user ID or system service responsible for each transition\n- Displays chronological timeline view in merchant backoffice\n- Filterable by customer-visible vs internal support notes", "TODO", "MEDIUM", "usr_samira", "cycle_cp_26", "ms_fulfillment"),
        ("Build bulk order status update API for merchant fulfillment operations", "Allow warehouse systems to mark hundreds of orders fulfilled in single batch.\n\n### Acceptance Criteria\n- Accepts batch of up to 500 order IDs with tracking numbers\n- Processes updates in parallel chunks with database batch updates\n- Returns individual success/error status per order\n- Dispatches customer shipping confirmation emails asynchronously", "TODO", "HIGH", "usr_zoe", "cycle_cp_26", "ms_fulfillment"),
        ("Implement customer order re-order functionality with instant cart population", "Re-purchase items from past order with instant verification of current availability.\n\n### Acceptance Criteria\n- Adds all available items from past order into active cart\n- Alerts customer if any item prices have changed since original purchase\n- Skips out-of-stock items with clear notification banner\n- Direct checkout redirect for streamlined 1-click re-ordering", "TODO", "LOW", "usr_chloe", "cycle_cp_26", "ms_fulfillment"),
        ("Build gift order processing with hidden invoice pricing and custom packing slip", "Support sending merchandise as gifts with personalized notes and hidden prices.\n\n### Acceptance Criteria\n- Packing slip prints with gift message and item descriptions without prices\n- Order confirmation email sent to buyer only; recipient receives tracking only\n- Optional gift receipt link allowing recipient to initiate exchange\n- Gift wrapping option flag transmitted to warehouse picking queue", "TODO", "LOW", "usr_maya", "cycle_cp_26", "ms_fulfillment"),
        ("Implement order export to CSV, JSON, and Apache Parquet formats", "Export large volumes of order data for business intelligence analysis.\n\n### Acceptance Criteria\n- Streams export directly to compressed S3 bucket for datasets > 50,000 orders\n- Configurable date range, order status, and merchant location filters\n- Includes customer shipping, billing, and itemized financial columns\n- Secure signed download link emailed to requesting merchant admin", "BACKLOG", "MEDIUM", "usr_samira", None, "ms_fulfillment"),
        ("Build customer return tracking status page with real-time carrier scans", "Provide customer with live milestone map tracking returned package in transit.\n\n### Acceptance Criteria\n- Shows: Return Label Created -> In Transit -> Received at Facility -> Refund Issued\n- Ingests carrier return package tracking events automatically\n- Estimates refund release date based on typical 48h warehouse grading SLA\n- Reduces support inquiry volume regarding return status by 35%", "BACKLOG", "MEDIUM", "usr_jordan", None, "ms_fulfillment"),
        ("Implement order address update service prior to warehouse dispatch", "Allow customer support or customers to correct typos in shipping address.\n\n### Acceptance Criteria\n- Address modification permitted only while order status is PENDING or PAID\n- Re-validates new address with postal verification service\n- Alerts warehouse if picking manifest was already printed\n- Logs address change audit event with operator user ID", "BACKLOG", "LOW", "usr_carlos", None, "ms_fulfillment"),
        ("Build merchant manual order creation tool for phone and in-person sales", "Allow customer support staff to create orders on behalf of customers.\n\n### Acceptance Criteria\n- Search customer profile or create new customer inline\n- Apply custom line item discounts and shipping fee overrides\n- Send secure credit card payment link to customer phone via SMS\n- Tracks support agent ID as order creator in audit log", "BACKLOG", "HIGH", "usr_diego", None, "ms_fulfillment"),
        ("Implement order fraud hold manual release workflow with audit logging", "Support releasing orders flagged by automated fraud engine after verification.\n\n### Acceptance Criteria\n- Fraud analyst reviews matched rules and customer identity documentation\n- 'Release Hold' action transitions order to PAID and notifies warehouse\n- Requires mandatory reason note before releasing held order\n- Secondary manager approval required on orders exceeding $2,500", "BACKLOG", "MEDIUM", "usr_miriam", None, "ms_fulfillment"),
        ("Build customer exchange item workflow pairing return with replacement order", "Support seamless replacement of returned apparel with different size or color.\n\n### Acceptance Criteria\n- Reserves replacement variant immediately upon exchange request\n- Dispatches replacement order once carrier scans return package at post office\n- Zero additional checkout transaction required if items are equal value\n- Charges or credits difference if replacement item price differs", "CANCELLED", "MEDIUM", "usr_david", None, "ms_fulfillment"),
        ("Audit order state machine race conditions during concurrent webhook callbacks", "Test order state machine under rapid concurrent webhook delivery.\n\n### Acceptance Criteria\n- Concurrently injects `PAYMENT_SUCCESS` and `ORDER_CANCELLED` webhooks\n- Database row-level locking (`SELECT FOR UPDATE`) prevents illegal state transitions\n- Deterministic winner resolution guarantees no orphaned paid orders\n- Verified across 1,000 synthetic race condition test runs", "IN_PROGRESS", "URGENT", "usr_aisha", "cycle_cp_25", "ms_fulfillment"),
        ("Finalize orders and returns end-to-end integration test validation suite", "Verify complete lifecycle from purchase through warehouse fulfillment and return.\n\n### Acceptance Criteria\n- End-to-end test executes order creation, capture, fulfillment, return, and refund\n- Validates financial balances, inventory counts, and customer notification receipts\n- Runs in staging CI matrix under 60 seconds\n- Zero flaky test failures across 20 consecutive test executions", "IN_PROGRESS", "HIGH", "usr_hannah", "cycle_cp_25", "ms_fulfillment"),
    ],

    # Workstream 7: Inventory & Warehouse Synchronization (NEX-143 to NEX-166)
    [
        ("Implement distributed inventory lock using Redis Redlock and lease renewal", "Provide high-concurrency inventory locking preventing overselling during flash sales.\n\n### Acceptance Criteria\n- Redlock algorithm distributed across 3 independent Redis instances\n- Lease renewal background heartbeats prevent premature expiration on slow ops\n- Automatic lock release on exception or process crash\n- Lock acquisition latency under 3ms at 5,000 concurrent requests/sec", "DONE", "URGENT", "usr_david", "cycle_cp_23", "ms_fulfillment"),
        ("Build multi-facility warehouse stock level aggregation service", "Aggregate inventory balances across multiple regional distribution centers.\n\n### Acceptance Criteria\n- Queries stock partitioned by warehouse ID and SKU\n- Computes total on-hand, reserved, and available-to-promise (ATP) quantities\n- Exposes low-latency cached inventory query API for storefront\n- Updates within 500ms of any warehouse inventory movement", "DONE", "HIGH", "usr_diego", "cycle_cp_23", "ms_fulfillment"),
        ("Implement stock reservation timeout worker returning unpurchased items", "Periodically release expired checkout reservations back to available stock.\n\n### Acceptance Criteria\n- BullMQ background queue worker scanning reservation expiry set every 30s\n- Decrements reserved count and increments available count atomically\n- Emits `INVENTORY_RESERVATION_RELEASED` event to event bus\n- Handles graceful worker shutdown without dropping in-flight releases", "DONE", "HIGH", "usr_diego", "cycle_cp_23", "ms_fulfillment"),
        ("Build safety stock buffer configuration per SKU and warehouse location", "Prevent stockouts by reserving buffer threshold before declaring out-of-stock.\n\n### Acceptance Criteria\n- Configurable safety buffer (e.g. reserve 5 units as buffer)\n- Available-to-promise displays 0 when on-hand reaches buffer threshold\n- Bulk buffer update tool in merchant inventory backoffice\n- Prevents inventory discrepancy stockouts by 90%", "DONE", "MEDIUM", "usr_samira", "cycle_cp_24", "ms_fulfillment"),
        ("Implement backorder threshold rules and estimated restock date display", "Allow continued customer purchasing when manufacturer replenishment is confirmed.\n\n### Acceptance Criteria\n- Configurable backorder limit per SKU\n- Displays estimated ship date on product page (e.g. 'Backordered: Ships Oct 28')\n- Dispatches backorder notification to merchant supply chain coordinator\n- Automatically marks backordered items for fulfillment when stock arrives", "DONE", "MEDIUM", "usr_carlos", "cycle_cp_24", "ms_fulfillment"),
        ("Build SAP ERP and NetSuite bidirectional inventory batch sync job", "Synchronize stock levels between central corporate ERP and NEXUS commerce platform.\n\n### Acceptance Criteria\n- Hourly delta sync job ingests inventory movements from SAP/NetSuite\n- Exports eCommerce orders to ERP sales ledger\n- Conflict resolution strategy defaults to ERP authoritative count on midnight reconciliation\n- Detailed sync exception logging and email alert on sync discrepancies", "DONE", "HIGH", "usr_samira", "cycle_cp_24", "ms_fulfillment"),
        ("Implement real-time stock alert threshold notifications for merchant buyers", "Alert inventory replenishment managers when high-velocity SKUs run low.\n\n### Acceptance Criteria\n- Evaluates reorder point: `(Lead Time * Average Daily Sales) + Safety Stock`\n- Sends automated email alert and Slack webhook notification to buyer team\n- Dashboard highlights critical SKUs with under 7 days of supply remaining\n- One-click purchase order generation pre-filling supplier reorder quantity", "DONE", "LOW", "usr_zoe", "cycle_cp_24", "ms_fulfillment"),
        ("Build warehouse transfer order state machine for inter-facility rebalancing", "Track inventory transit between central distribution hub and regional fulfillment centers.\n\n### Acceptance Criteria\n- States: DRAFT -> DISPATCHED -> IN_TRANSIT -> RECEIVED -> RECONCILED\n- Moves inventory from source on-hand into 'In-Transit' virtual location\n- Increments destination on-hand upon receiving barcode scan\n- Flags transfer variance if received quantity differs from manifest", "IN_PROGRESS", "MEDIUM", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Implement cycle count reconciliation tool with shrinkage audit logging", "Empower warehouse teams to conduct routine inventory audits and record adjustments.\n\n### Acceptance Criteria\n- Compares physical barcode count against expected system balance\n- Requires mandatory reason code for adjustments (Damaged, Theft, Counting Error)\n- Supervisor authorization required for shrinkage adjustments exceeding $500\n- Automatically adjusts balance and writes immutable financial journal entry", "IN_PROGRESS", "HIGH", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Build barcode scanning inventory receiving workflow for mobile devices", "Streamline inbound supplier shipment intake via mobile web barcode scanners.\n\n### Acceptance Criteria\n- Scans supplier master carton barcode or individual item 2D datamatrix\n- Validates incoming items against pending Purchase Order (PO)\n- Supports partial receiving when supplier ships split shipments\n- Updates catalog available stock immediately upon receiving confirmation", "IN_PROGRESS", "MEDIUM", "usr_jordan", "cycle_cp_25", "ms_fulfillment"),
        ("Implement SKU bundle inventory deduction ensuring component stock consistency", "Deduct component inventory atomically when customer purchases multi-item bundles.\n\n### Acceptance Criteria\n- Atomic transaction decrements all bundle child components\n- Rollback and abort purchase if any individual component runs out of stock\n- Recalculates available bundle count across all storefront channels\n- Verified with 500 concurrent bundle purchase load tests", "IN_PROGRESS", "HIGH", "usr_carlos", "cycle_cp_25", "ms_fulfillment"),
        ("Build warehouse bin location assignment and picking optimization engine", "Assign merchandise to optimal warehouse shelf bins and compute picking route.\n\n### Acceptance Criteria\n- Stores Aisle-Rack-Shelf-Bin coordinates per SKU\n- Traveling Salesperson heuristic optimizes warehouse pick path walking distance\n- Batch picking mode groups multiple orders into single warehouse sweep\n- Reduces average warehouse order picking time by 28%", "IN_REVIEW", "MEDIUM", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Implement supplier Purchase Order (PO) creation and stock receiving pipeline", "Manage vendor purchase orders from procurement draft through warehouse delivery.\n\n### Acceptance Criteria\n- Tracks supplier terms, unit cost, promised delivery date, and payment status\n- Exports standard EDI 850 or PDF purchase order document to vendor\n- Automatically matches vendor invoices against receiving dock receipts (3-way match)\n- Updates average landed unit cost across inventory accounting records", "IN_REVIEW", "LOW", "usr_samira", "cycle_cp_25", "ms_fulfillment"),
        ("Build out-of-stock notification sign-up for storefront customer back-in-stock alerts", "Allow storefront customers to submit email for alerts when sold-out items return.\n\n### Acceptance Criteria\n- Capture customer email on out-of-stock product variant page\n- Deduplicates requests and honors marketing communication preferences\n- Automatically triggers notification dispatch when inventory replenishes > 0\n- Ranks waitlist by signup timestamp for priority allocation", "TODO", "LOW", "usr_chloe", "cycle_cp_26", "ms_fulfillment"),
        ("Implement inventory velocity analytics and days-of-inventory-remaining forecast", "Forecast inventory run-out dates based on rolling 7-day and 30-day sales velocity.\n\n### Acceptance Criteria\n- Calculates Days-of-Inventory-Remaining (DIR) per SKU\n- Visualizes stock depletion trajectory in merchant inventory dashboard\n- Highlights overstocked slow-moving inventory for clearance promotion\n- Exports inventory health report to CSV and Excel formats", "TODO", "MEDIUM", "usr_samira", "cycle_cp_26", "ms_fulfillment"),
        ("Build bulk inventory adjustment CSV upload tool with dry-run validation", "Allow operations teams to update stock quantities across 50,000 SKUs via spreadsheet.\n\n### Acceptance Criteria\n- Validates SKU existence and warehouse location codes in dry-run mode\n- Displays preview of net inventory adjustments before committing changes\n- Streaming database batch upserts process 50,000 rows in under 30 seconds\n- Detailed error log generated for any un-matched SKU rows", "TODO", "MEDIUM", "usr_zoe", "cycle_cp_26", "ms_fulfillment"),
        ("Implement multi-location routing allocation choosing closest warehouse to customer", "Route order line items to warehouse facility closest to destination postal code.\n\n### Acceptance Criteria\n- Calculates distance between customer shipping address and warehouse nodes\n- Prioritizes warehouses holding all items in single shipment to minimize freight\n- Falls back to split fulfillment if no single facility holds full basket\n- Lowers average transit delivery time by 1.2 business days", "TODO", "HIGH", "usr_diego", "cycle_cp_26", "ms_fulfillment"),
        ("Build inventory reservation telemetry dashboard with active lock gauges", "Monitor real-time inventory locks and contention across hot promotional SKUs.\n\n### Acceptance Criteria\n- Real-time Grafana dashboard displaying active Redis lock count\n- Highlights high-contention SKUs with > 100 concurrent checkout attempts\n- Tracks lock acquisition duration histogram and timeout count\n- Alert triggers if lock acquisition failure rate exceeds 2%", "BACKLOG", "MEDIUM", "usr_elena", None, "ms_fulfillment"),
        ("Implement pre-order campaign stock allocation and fulfillment scheduling", "Manage pre-order merchandise with designated future release dates.\n\n### Acceptance Criteria\n- Segregates pre-order stock allocation from standard live inventory\n- Restricts checkout to pre-orders when item is not yet physically released\n- Automated bulk order release to warehouse picking queue on launch morning\n- Notifies pre-order customers with shipping countdown updates", "BACKLOG", "LOW", "usr_carlos", None, "ms_fulfillment"),
        ("Build dead-stock identification report for merchant merchandising clearance", "Identify merchandise with zero sales over past 90 days across all warehouses.\n\n### Acceptance Criteria\n- Computes holding cost and capital tied up in dead stock inventory\n- Recommends bundle discount or clearance price markdown percentage\n- Filters by brand, supplier, and warehouse storage footprint\n- Helps merchandisers free up warehouse shelf capacity", "BACKLOG", "LOW", "usr_samira", None, "ms_fulfillment"),
        ("Implement warehouse fulfillment blackout dates and holiday calendar rules", "Account for warehouse holiday closures in storefront delivery date estimates.\n\n### Acceptance Criteria\n- Configurable holiday and maintenance blackout dates per warehouse facility\n- Shipping promise engine skips blackout days when calculating delivery dates\n- Merchant backoffice alert warning of upcoming shipping cut-off deadlines\n- Synchronizes with carrier holiday schedules (FedEx, UPS)", "CANCELLED", "LOW", "usr_diego", None, "ms_fulfillment"),
        ("Build serialized inventory tracking for high-value luxury and electronics items", "Track individual serial numbers for electronics and luxury merchandise.\n\n### Acceptance Criteria\n- Scans unique serial number during warehouse picking and packing\n- Associates serial number with customer order record and warranty registration\n- Validates serial number on returns to prevent fraudulent return substitution\n- Compliance reporting for regulated serialized merchandise", "BACKLOG", "HIGH", "usr_zoe", None, "ms_fulfillment"),
        ("Audit inventory lock performance under 10,000 concurrent product drop spike", "Simulate viral product drop with 10,000 customers competing for 500 units.\n\n### Acceptance Criteria\n- Zero overselling: exactly 500 units sold, 0 negative inventory balances\n- Lock contention handled gracefully without worker memory exhaustion\n- Customers receive instant 'Sold Out' notification once 500 units reserved\n- Full performance report archived in engineering documentation", "IN_PROGRESS", "URGENT", "usr_devon", "cycle_cp_25", "ms_fulfillment"),
        ("Finalize warehouse inventory sync integration contract test suite", "Verify that inventory decrements, holds, and syncs operate with 100% data consistency.\n\n### Acceptance Criteria\n- End-to-end integration tests verify stock levels across Redis, Postgres, and ERP\n- Chaos tests simulate worker crash during stock adjustment with zero drift\n- Runs automatically in CI/CD release qualification pipeline\n- All 65 test cases pass cleanly with 100% deterministic reproducibility", "IN_PROGRESS", "HIGH", "usr_hannah", "cycle_cp_25", "ms_fulfillment"),
    ],

    # Workstream 8: Shipping & Fulfillment (NEX-167 to NEX-188)
    [
        ("Implement multi-carrier rate shopping service (FedEx, UPS, DHL Express, USPS)", "Fetch real-time shipping rate quotes across multiple logistics carriers.\n\n### Acceptance Criteria\n- Queries FedEx, UPS, DHL, and USPS rate APIs in parallel\n- Normalizes rate responses to common shipping tier schema\n- Automatically selects lowest-cost carrier meeting delivery transit SLA\n- Fallback to cached rate matrix if carrier API fails to respond within 1.5s", "DONE", "HIGH", "usr_diego", "cycle_cp_24", "ms_fulfillment"),
        ("Build shipping label generation service producing ZPL and PDF thermal formats", "Generate shipping barcode labels ready for warehouse industrial thermal printers.\n\n### Acceptance Criteria\n- Generates 4x6 inch 203 DPI ZPL format for Zebra printers\n- Generates standard PDF format for desktop printing\n- Embeds carrier tracking barcode and routing delivery codes\n- Label generation completes in under 400ms per order", "DONE", "HIGH", "usr_diego", "cycle_cp_24", "ms_fulfillment"),
        ("Implement warehouse order routing optimization algorithm based on freight cost", "Assign orders to optimal warehouse nodes minimizing total freight shipping costs.\n\n### Acceptance Criteria\n- Evaluates carrier shipping zone charts from each facility to customer destination\n- Chooses single-facility fulfillment whenever possible to prevent split freight\n- Considers warehouse labor capacity limits and current queue backlog\n- Reduces average outbound shipping expense by 8.5%", "DONE", "HIGH", "usr_diego", "cycle_cp_24", "ms_fulfillment"),
        ("Build split-shipment fulfillment calculator when items are in multiple facilities", "Split multi-item order into separate packages when stock is geographically separated.\n\n### Acceptance Criteria\n- Groups line items by warehouse node\n- Generates independent shipping labels and tracking numbers per package\n- Customer charged single unified shipping fee without unexpected split surcharge\n- Dispatches separate tracking notifications as each package ships", "DONE", "MEDIUM", "usr_carlos", "cycle_cp_24", "ms_fulfillment"),
        ("Implement carrier tracking webhook ingestion parsing standardized delivery events", "Ingest delivery milestone updates from carrier webhooks into order timeline.\n\n### Acceptance Criteria\n- Standardizes events: Label Created, Picked Up, In Transit, Out for Delivery, Delivered\n- Updates order fulfillment status to DELIVERED automatically\n- Detects delivery exceptions (Weather Delay, Incorrect Address)\n- Verifies carrier webhook signature to prevent fraudulent delivery spoofing", "DONE", "HIGH", "usr_kevin", "cycle_cp_24", "ms_fulfillment"),
        ("Build customer branded tracking portal with interactive transit milestone map", "Provide customer with tracking page matching merchant brand rather than generic carrier site.\n\n### Acceptance Criteria\n- Displays live progress bar and estimated delivery date\n- Interactive map displaying package route and current transit hub\n- Mobile responsive design with zero layout shift\n- Retains customer on merchant domain, increasing re-order cross-sell by 15%", "DONE", "MEDIUM", "usr_marcus", "cycle_cp_24", "ms_fulfillment"),
        ("Implement customs declaration documentation generation for cross-border shipping", "Generate commercial invoice and CN22/CN23 customs documentation for exports.\n\n### Acceptance Criteria\n- Ingests Harmonized Tariff System (HTS) codes per product SKU\n- Calculates itemized declared values and country-of-origin metadata\n- Generates compliant PDF commercial invoices for customs clearance\n- Transmits electronic customs data (ETD) directly to international carriers", "IN_PROGRESS", "HIGH", "usr_felix", "cycle_cp_25", "ms_fulfillment"),
        ("Build warehouse pick list and packing slip batch generator with barcode validation", "Generate consolidated batch picking lists and customer packing slips.\n\n### Acceptance Criteria\n- Generates wave picking manifests grouping up to 50 orders\n- Packing slips include merchant branding and return instructions\n- Barcode on packing slip matches order ID for instant packing verification scan\n- Batch PDF generation streams to warehouse printer without spool delays", "IN_PROGRESS", "MEDIUM", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Implement shipping carrier end-of-day dispatch manifest (SCAN form) generator", "Generate daily USPS SCAN form and carrier manifests for postal carrier pickup.\n\n### Acceptance Criteria\n- Consolidates all shipping labels generated during business day into single master barcode\n- Postal driver scans single master barcode on dock, accepting all packages\n- Transmits electronic manifest manifest to carrier API by 6:00 PM cutoff\n- Prevents lost packages and missing initial acceptance scans", "IN_PROGRESS", "LOW", "usr_diego", "cycle_cp_25", "ms_fulfillment"),
        ("Build delivery exception handler (Address Incomplete, Delivery Attempted)", "Automatically alert customer and support staff when delivery carrier encounters issue.\n\n### Acceptance Criteria\n- Detects carrier exception status codes (Notice Left, Address Unknown)\n- Sends immediate SMS and email alert to customer with link to update address\n- Opens customer support ticket in merchant helpdesk\n- Prevents automated return-to-sender by resolving exception within 24 hours", "IN_REVIEW", "MEDIUM", "usr_chloe", "cycle_cp_25", "ms_fulfillment"),
        ("Implement shipping insurance calculation and automated claim submission API", "Offer customer shipping protection against loss, theft, and damage.\n\n### Acceptance Criteria\n- Integrates with Route / Shipsurance API for 1-click cart insurance opt-in\n- Records premium fee in financial ledger\n- Automated claim initiation API if carrier declares package lost\n- Replaces order immediately upon claim verification without customer friction", "IN_REVIEW", "LOW", "usr_felix", "cycle_cp_25", "ms_fulfillment"),
        ("Build customer delivery signature requirement and age verification rules", "Enforce adult signature on delivery for high-value and age-restricted items.\n\n### Acceptance Criteria\n- Automatically flags carrier label with 'Adult Signature Required (21+)'\n- Enforces signature flag on orders containing alcohol or tobacco SKUs\n- Displays signature fee transparently in shipping rate breakdown\n- Ingests recipient signature image from carrier proof-of-delivery webhook", "TODO", "LOW", "usr_carlos", "cycle_cp_26", "ms_fulfillment"),
        ("Implement freight LTL (Less-Than-Truckload) rate quotes for oversized merchandise", "Quote pallet freight shipping for oversized furniture and bulky equipment.\n\n### Acceptance Criteria\n- Quotes freight carriers (C.H. Robinson, Freightquote, Estes)\n- Calculates freight class based on shipment density and pallet dimensions\n- Includes liftgate and residential delivery accessorial options\n- Dispatches bill of lading (BOL) documentation to freight carrier", "TODO", "MEDIUM", "usr_diego", "cycle_cp_26", "ms_fulfillment"),
        ("Build warehouse packing box dimension optimization algorithm (3D Bin Packing)", "Recommend optimal cardboard box dimensions to minimize dimensional weight charges.\n\n### Acceptance Criteria\n- 3D bin packing heuristic fits order item dimensions into standard box sizes\n- Selects smallest box preventing product damage and excess air volume\n- Displays 3D packing diagram to warehouse packing station staff\n- Reduces dimensional weight carrier surcharges by 14%", "TODO", "MEDIUM", "usr_diego", "cycle_cp_26", "ms_fulfillment"),
        ("Implement green shipping carbon-offset calculation and eco-routing options", "Calculate carbon footprint of order delivery and offer carbon-neutral delivery.\n\n### Acceptance Criteria\n- Calculates CO2 emissions based on shipment weight and transit distance\n- Integrates with carbon offset providers (Pachama / Cloverly)\n- Customer option to add carbon offset donation at checkout\n- Highlights ground eco-shipping options over air freight", "TODO", "LOW", "usr_maya", "cycle_cp_26", "ms_fulfillment"),
        ("Build local courier on-demand delivery integration (DoorDash Drive / Uber Direct)", "Offer same-day local delivery from retail stores within 15-mile radius.\n\n### Acceptance Criteria\n- Quotes live courier delivery fee via DoorDash Drive API\n- Dispatches driver automatically when store staff marks order packed\n- Customer tracks live driver GPS location on storefront tracking portal\n- Fallback to standard carrier if no courier driver available within 30 min", "BACKLOG", "MEDIUM", "usr_jordan", None, "ms_fulfillment"),
        ("Implement shipping address PO Box and military APO/FPO validation constraints", "Prevent carrier selection incompatibilities with military and PO Box destinations.\n\n### Acceptance Criteria\n- Restricts carrier selection to USPS for PO Box and APO/FPO addresses\n- Disables FedEx and UPS Ground options which do not deliver to PO Boxes\n- Prompts customer for physical street address if private carrier required\n- Eliminates address carrier rejection failures at shipping label generation", "BACKLOG", "LOW", "usr_carlos", None, "ms_fulfillment"),
        ("Build carrier SLA performance scorecard tracking on-time delivery percentages", "Track logistics carrier reliability and on-time delivery performance.\n\n### Acceptance Criteria\n- Measures percentage of packages delivered within promised carrier window\n- Reports average transit days partitioned by shipping lane and carrier\n- Flags chronic carrier delays for contract renegotiation\n- Monthly executive scorecard exported to merchant operations leadership", "BACKLOG", "LOW", "usr_samira", None, "ms_fulfillment"),
        ("Implement package temperature monitoring integration for perishable food goods", "Track cold-chain sensor status for refrigerated food and pharmaceutical shipments.\n\n### Acceptance Criteria\n- Ingests IoT temperature logger data upon delivery\n- Flags order for immediate customer replacement if temperature breached threshold\n- Notifies quality assurance team of cold-chain failure\n- Compliance logging meeting FDA perishable goods transport standards", "CANCELLED", "MEDIUM", "usr_diego", None, "ms_fulfillment"),
        ("Build return-to-sender (RTS) automated package re-routing to central depot", "Handle packages returned by carrier due to bad address or customer refusal.\n\n### Acceptance Criteria\n- Detects carrier RTS status update automatically\n- Creates incoming warehouse intake manifest for returned parcel\n- Contacts customer via email to verify address or initiate refund\n- Automatically releases items back to warehouse stock upon receiving scan", "BACKLOG", "LOW", "usr_carlos", None, "ms_fulfillment"),
        ("Audit carrier API timeout fallbacks and rate limit retry exponential backoffs", "Verify that carrier API outages do not block warehouse label generation stations.\n\n### Acceptance Criteria\n- Mock server injects 500ms latency and 10% connection timeouts\n- Verifies automated fallback to alternate carrier within 2 seconds\n- Exponential backoff retry with jitter on carrier 429 rate limit responses\n- Zero stalled warehouse packing lines during carrier network blips", "IN_PROGRESS", "HIGH", "usr_devon", "cycle_cp_25", "ms_fulfillment"),
        ("Finalize shipping and fulfillment regression tests against carrier test environments", "Validate full carrier integration test matrix across USPS, FedEx, UPS, and DHL.\n\n### Acceptance Criteria\n- Generates test shipping labels and voids test shipments in carrier sandboxes\n- Validates tracking webhook ingestion across all event milestone types\n- Test suite executes cleanly in CI/CD pipeline in under 45 seconds\n- 100% pass rate achieved on logistics integration test suite", "IN_PROGRESS", "HIGH", "usr_aisha", "cycle_cp_25", "ms_fulfillment"),
    ],

    # Workstream 9: Customer Notifications (NEX-189 to NEX-210)
    [
        ("Implement transactional email delivery service with SendGrid and AWS SES fallbacks", "Build resilient email delivery provider with automated primary-to-secondary fallback.\n\n### Acceptance Criteria\n- Primary provider SendGrid; automated fallback to AWS SES on 5xx errors\n- Circuit breaker trips after 3 consecutive email provider timeouts\n- Asynchronous queue worker processing up to 2,000 emails per minute\n- Zero lost transactional emails during provider service degradation", "DONE", "HIGH", "usr_alex", "cycle_cp_23", "ms_checkout"),
        ("Design responsive HTML email templates for Order Confirmation and Shipping Updates", "Build email templates rendering consistently across Apple Mail, Gmail, and Outlook.\n\n### Acceptance Criteria\n- Responsive single-column layout on mobile devices\n- Verified rendering across 45 email clients via Litmus test suite\n- Dark mode support with CSS `@media (prefers-color-scheme: dark)`\n- Includes order details, tracking link button, and support contact details", "DONE", "MEDIUM", "usr_marcus", "cycle_cp_23", "ms_checkout"),
        ("Build SMS notification gateway integrating with Twilio and Sinch APIs", "Deliver real-time text message shipping alerts to opt-in customer mobile numbers.\n\n### Acceptance Criteria\n- Integrates Twilio Messaging Services with international phone number routing\n- Primary carrier fallback to Sinch SMS API\n- Message templates comply with CTIA and 10DLC carrier compliance regulations\n- Delivery status webhooks track SMS delivery confirmation in real-time", "DONE", "HIGH", "usr_kevin", "cycle_cp_24", "ms_fulfillment"),
        ("Implement customer notification preferences center (Email, SMS, Push Opt-ins)", "Empower customers to customize notification channels for order and marketing alerts.\n\n### Acceptance Criteria\n- Granular toggles: Order Updates, Shipping Alerts, Promotions, Price Drops\n- Retains mandatory transactional notifications (Order Confirmation, Password Reset)\n- One-click unsubscribe link in marketing emails updates preferences instantly\n- Synchronizes preferences with customer profile in database", "DONE", "MEDIUM", "usr_marcus", "cycle_cp_24", "ms_checkout"),
        ("Build browser Web Push notification service with service worker registration", "Deliver desktop and mobile browser push notifications for shipping milestones.\n\n### Acceptance Criteria\n- Implements VAPID protocol with Web Push standard\n- Service worker handles incoming push event and displays native notification\n- Clicking notification deep-links directly to customer order tracking page\n- Gracefully handles revoked browser push permissions", "DONE", "LOW", "usr_jordan", "cycle_cp_24", "ms_fulfillment"),
        ("Implement localized customer notifications based on order destination language", "Translate transactional emails and SMS messages into customer native language.\n\n### Acceptance Criteria\n- Selects language template matching customer order locale\n- Translates date formats, currency symbols, and address layouts appropriately\n- Fallback to English if translation for target language missing\n- Tested across 8 localized language variations", "IN_PROGRESS", "MEDIUM", "usr_sofia", "cycle_cp_25", "ms_checkout"),
        ("Build abandoned cart reminder email cadence with personalized discount links", "Recover abandoned carts with timed multi-step email notification sequence.\n\n### Acceptance Criteria\n- Step 1 at 2 hours; Step 2 at 24 hours with dynamic 10% coupon code\n- Embeds high-res product thumbnails of items remaining in cart\n- 1-click cart restoration link repopulates checkout immediately\n- Excludes customers who placed order or opted out of marketing communications", "IN_PROGRESS", "MEDIUM", "usr_maya", "cycle_cp_25", "ms_checkout"),
        ("Implement back-in-stock alert notification queue with batched dispatch rate", "Notify waitlisted customers when out-of-stock merchandise arrives in warehouse.\n\n### Acceptance Criteria\n- Dispatches notifications in batches matching available stock volume\n- Prevents sending 5,000 alerts when only 10 units replenished\n- High-speed delivery via email and SMS within 2 minutes of inventory receipt\n- Tracks notification conversion rate in merchandising analytics", "IN_PROGRESS", "HIGH", "usr_carlos", "cycle_cp_25", "ms_fulfillment"),
        ("Build price drop notification trigger when wishlisted product discount applies", "Alert customers when saved items go on sale or receive promotional discount.\n\n### Acceptance Criteria\n- Daily cron worker checks wishlist SKUs against updated catalog price list\n- Triggers email and mobile push when price drops by at least 10%\n- Includes original price, sale price, and percentage savings in message\n- One-click 'Buy Now' button redirects directly to pre-filled checkout", "IN_REVIEW", "LOW", "usr_chloe", "cycle_cp_25", "ms_checkout"),
        ("Implement customer review request email trigger 7 days after delivery confirmation", "Request product reviews and feedback following verified customer order delivery.\n\n### Acceptance Criteria\n- Triggers exactly 7 days after carrier delivery webhook timestamp\n- Embeds 1-5 star rating selector directly inside email template\n- Direct link to pre-filled review submission form on storefront\n- Suppresses review request if customer initiated return or refund", "IN_REVIEW", "LOW", "usr_marcus", "cycle_cp_25", "ms_fulfillment"),
        ("Build merchant broadcast notification tool for critical service announcements", "Allow merchants to send system-wide maintenance or shipping delay banners.\n\n### Acceptance Criteria\n- Displays dismissible banner at top of customer storefront\n- Broadcasts urgent SMS/email alerts to customers with affected pending orders\n- Rich text editor with preview simulator in merchant backoffice\n- Audit log tracks author, broadcast message content, and publication timestamp", "TODO", "MEDIUM", "usr_tariq", "cycle_cp_26", "ms_checkout"),
        ("Implement email bounce, spam complaint, and unsubscribe suppression list sync", "Maintain global email suppression list protecting domain sender reputation.\n\n### Acceptance Criteria\n- Ingests SendGrid / SES bounce and spam complaint webhooks\n- Automatically marks bounced email addresses on suppression list\n- Prevents future email dispatch attempts to suppressed addresses\n- Reduces bounce rate to under 0.5%, keeping domain off email blocklists", "TODO", "HIGH", "usr_elena", "cycle_cp_26", "ms_checkout"),
        ("Build order delivery proof SMS with carrier photo attachment link", "Send customer SMS alert with link to delivery photo taken by carrier driver.\n\n### Acceptance Criteria\n- Extracts delivery photo URL from carrier delivery webhook payload\n- Generates branded short link with click tracking\n- Dispatched within 60 seconds of carrier package drop-off\n- Reduces 'Where Is My Order' (WISMO) customer service inquiries by 22%", "TODO", "LOW", "usr_diego", "cycle_cp_26", "ms_fulfillment"),
        ("Implement PDF receipt attachment generation in confirmation email dispatcher", "Attach formal tax invoice PDF directly to customer order confirmation emails.\n\n### Acceptance Criteria\n- Generates compact, compressed PDF receipt under 100KB\n- Attached directly to transactional order confirmation email\n- Compliant with French and German electronic invoice requirements\n- Fallback to download link if email provider attachment limit exceeded", "TODO", "LOW", "usr_zoe", "cycle_cp_26", "ms_checkout"),
        ("Build notification delivery status dashboard with open and click-through rates", "Provide operations teams with real-time email and SMS deliverability metrics.\n\n### Acceptance Criteria\n- Real-time Grafana dashboard tracking email delivery, open, and click rates\n- SMS delivery receipt (DLR) status breakdown (Delivered, Undelivered, Expired)\n- Alert triggers if transactional email delivery rate falls below 98.5%\n- Partitioned by notification message type and destination country", "BACKLOG", "MEDIUM", "usr_elena", None, "ms_checkout"),
        ("Implement mobile app push notification payload builder (FCM and Apple APNs)", "Construct rich push notification payloads for iOS and Android native apps.\n\n### Acceptance Criteria\n- Supports Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs)\n- Includes rich notification image preview, sound, and deep-link URI\n- Background badge count incrementing on customer app icon\n- Handles expired device registration tokens automatically", "BACKLOG", "MEDIUM", "usr_jordan", None, "ms_fulfillment"),
        ("Build customer password reset notification email with 15-minute expiring link", "Send secure single-use password reset links upon customer forgotten password request.\n\n### Acceptance Criteria\n- Generates 256-bit entropy token with 15-minute hard expiration\n- Renders security notice with request IP address and browser type\n- Invalids token immediately upon successful password modification\n- Dispatches security alert if password was changed successfully", "DONE", "HIGH", "usr_alex", "cycle_cp_24", "ms_checkout"),
        ("Implement merchant new order audio and visual notification alert in backoffice", "Alert merchant backoffice operators in real-time when new order arrives.\n\n### Acceptance Criteria\n- WebSocket push notification to connected merchant admin dashboard sessions\n- Subtle audio chime and desktop notification banner\n- Highlighted badge counter on order navigation rail item\n- Configurable toggle allowing operators to mute audio alerts", "BACKLOG", "LOW", "usr_maya", None, "ms_fulfillment"),
        ("Build customer return received and refund issued notification dispatchers", "Keep customers informed as returned packages progress through warehouse inspection.\n\n### Acceptance Criteria\n- Dispatches 'Return Package Received' notification upon carrier scan at warehouse dock\n- Dispatches 'Refund Processed' notification when payment refund is submitted\n- Includes credit card last 4 digits and expected 3-5 business day bank posting window\n- Eliminates customer anxiety regarding return progress", "DONE", "MEDIUM", "usr_chloe", "cycle_cp_24", "ms_fulfillment"),
        ("Implement notification rate limiter per customer preventing message fatigue", "Ensure customers do not receive more than 3 non-critical messages in 24-hour window.\n\n### Acceptance Criteria\n- Tracks notification count per customer in Redis sorted set\n- Throttles promotional and marketing messages when limit exceeded\n- Exempts critical transactional alerts (Order Confirmation, Security Notices)\n- Logs throttled notification attempts for marketing audit", "CANCELLED", "LOW", "usr_samira", None, "ms_checkout"),
        ("Audit email deliverability DKIM, SPF, and DMARC alignment records", "Verify DNS authentication records ensure 100% email inbox placement.\n\n### Acceptance Criteria\n- 2048-bit DKIM key rotation and DNS TXT record validation\n- SPF record includes authorized IP ranges without exceeding 10 DNS lookups\n- DMARC policy set to `p=reject` with aggregate RUA reporting enabled\n- Automated test verifies 100% authentication alignment across test domains", "IN_PROGRESS", "HIGH", "usr_elena", "cycle_cp_25", "ms_checkout"),
        ("Finalize customer notification test matrix across major email and SMS clients", "Comprehensive validation verifying formatting across all supported customer channels.\n\n### Acceptance Criteria\n- Validates email rendering in Gmail, Outlook, Apple Mail, and Yahoo\n- Tests SMS delivery across AT&T, Verizon, T-Mobile, and Vodafone UK\n- Verifies all tracking links, unsubscribe actions, and button clicks resolve properly\n- 100% test pass rate recorded in release verification report", "IN_PROGRESS", "HIGH", "usr_hannah", "cycle_cp_25", "ms_fulfillment"),
    ],

    # Workstream 10: Merchant Administration (NEX-211 to NEX-234)
    [
        ("Implement merchant backoffice executive dashboard with real-time sales metrics", "Build high-density executive dashboard displaying GMV, orders, and average order value.\n\n### Acceptance Criteria\n- Displays live Gross Merchandise Value (GMV), order count, and AOV\n- Interactive time-range selector: Today, Yesterday, Last 7 Days, Month-to-Date\n- Comparison badges showing percentage growth over prior period\n- Sub-second query response time powered by pre-aggregated database materialized views", "DONE", "HIGH", "usr_rachel", "cycle_cp_25", "ms_pilot"),
        ("Build top-performing products, categories, and brands analytics widget", "Rank best-selling merchandise by units sold, total revenue, and conversion rate.\n\n### Acceptance Criteria\n- Top 10 products table with thumbnail, SKU, units sold, and gross revenue\n- Sparkline trend charts showing daily velocity for each top item\n- Filterable by merchant store location and product category\n- One-click export to CSV for merchandising inventory planning", "DONE", "MEDIUM", "usr_samira", "cycle_cp_25", "ms_pilot"),
        ("Implement conversion funnel visualization (Visitor -> Cart -> Checkout -> Order)", "Visualize customer drop-off at each stage of eCommerce purchasing journey.\n\n### Acceptance Criteria\n- Funnel chart displaying counts and drop-off percentages at each step\n- Segments funnel by device type (Desktop vs Mobile) and traffic source\n- Highlights anomalous step drop-off rates with warning badges\n- Daily snapshot archived to data warehouse for long-term cohort analysis", "DONE", "HIGH", "usr_maya", "cycle_cp_25", "ms_pilot"),
        ("Build merchant store branding configuration (Logo, Primary Colors, Typography)", "Provide intuitive customization panel for store theme styling and assets.\n\n### Acceptance Criteria\n- Live preview iframe updates in real-time as colors and fonts change\n- Generates custom CSS variables injected into storefront root layout\n- Uploads merchant logo and favicon with automated resizing\n- WCAG color contrast checker warns if chosen button colors fail accessibility", "DONE", "MEDIUM", "usr_chloe", "cycle_cp_25", "ms_pilot"),
        ("Implement merchant staff invitation management with role permissions dropdown", "Allow store owners to invite employees and assign granular administrative roles.\n\n### Acceptance Criteria\n- Invites staff via email with designated role (Admin, Merchandiser, Support)\n- Displays pending, active, and revoked staff memberships in table\n- One-click revoke access terminates employee sessions immediately\n- Prevents last active Admin in workspace from being removed or downgraded", "IN_PROGRESS", "URGENT", "usr_sarah", "cycle_cp_25", "ms_pilot"),
        ("Build customer relationship management (CRM) customer profile view with LTV metric", "Display comprehensive customer timeline, total spend, and purchase history.\n\n### Acceptance Criteria\n- Calculates Lifetime Value (LTV) and average order frequency\n- Chronological activity log showing orders, returns, support tickets, and reviews\n- Customer tag management (VIP, High Return Risk, Wholesale)\n- Internal staff notes editor with author attribution and timestamps", "IN_PROGRESS", "HIGH", "usr_carlos", "cycle_cp_25", "ms_pilot"),
        ("Implement merchant custom domain management with automated Let's Encrypt SSL", "Support custom storefront domains (e.g., `store.brand.com`) with automated SSL certificates.\n\n### Acceptance Criteria\n- Automated DNS CNAME record verification check\n- Provisions Let's Encrypt SSL/TLS certificate via ACME protocol\n- Automated certificate renewal 30 days prior to expiration\n- Zero downtime domain cutover with HTTP to HTTPS enforcement", "IN_PROGRESS", "HIGH", "usr_elena", "cycle_cp_25", "ms_pilot"),
        ("Build promotional campaign builder with start/end schedules and budget limits", "Configure storewide promotional sales with automated start and expiration triggers.\n\n### Acceptance Criteria\n- Configurable promotion rules: Percentage Off, Fixed Amount, BOGO, Free Shipping\n- Set campaign start date, end date, and overall promotional budget limit\n- Automatically disables promotion when budget limit reached\n- Real-time campaign performance analytics tracking attributed revenue", "IN_PROGRESS", "MEDIUM", "usr_carlos", "cycle_cp_25", "ms_pilot"),
        ("Implement merchant store maintenance mode toggle with customizable banner", "Allow merchants to take storefront offline for maintenance with password bypass.\n\n### Acceptance Criteria\n- Displays branded 'Coming Soon / Under Maintenance' page to public visitors\n- Secret password input allows merchant staff and VIPs to preview live store\n- Configurable customer email signup form on maintenance splash screen\n- Toggle switch in merchant backoffice takes store live instantly", "IN_REVIEW", "LOW", "usr_chloe", "cycle_cp_25", "ms_pilot"),
        ("Build merchant webhook configuration portal for external ERP/CRM subscribers", "Allow merchant developers to register HTTPS webhook endpoints for store events.\n\n### Acceptance Criteria\n- Select subscription events (e.g. `order.created`, `customer.updated`)\n- Test webhook delivery with sample payload generator\n- Webhook delivery history log showing HTTP status codes, latency, and response bodies\n- Automatic webhook disabling after 50 consecutive failed deliveries", "IN_REVIEW", "HIGH", "usr_tariq", "cycle_cp_25", "ms_pilot"),
        ("Implement bulk data export pipeline delivering compressed Parquet files to S3", "Export massive historical datasets into columnar Apache Parquet format for analytics.\n\n### Acceptance Criteria\n- Supports exporting Orders, Products, Customers, and Inventory ledgers\n- Compresses files using Snappy compression directly to private S3 bucket\n- Generates secure signed URL valid for 2 hours for merchant download\n- Streaming pipeline handles 1,000,000 order records without memory bloat", "TODO", "MEDIUM", "usr_samira", "cycle_cp_26", "ms_pilot"),
        ("Build merchant audit log explorer tracking staff admin actions and updates", "Provide searchable audit trail of all actions performed by merchant employees.\n\n### Acceptance Criteria\n- Logs: Staff User, Action, Entity Type, Entity ID, IP Address, Timestamp\n- Detailed diff viewer highlighting before and after values on updated records\n- Filterable by staff member, action type, and date range\n- Immutable audit records cannot be deleted or modified by any staff role", "TODO", "HIGH", "usr_rachel", "cycle_cp_26", "ms_pilot"),
        ("Implement merchant tax nexus configuration per state, province, and country", "Configure physical and economic tax nexus jurisdictions for accurate tax collection.\n\n### Acceptance Criteria\n- Toggle active nexus status per US state, Canadian province, and EU country\n- Track economic nexus revenue and transaction count thresholds per state\n- Automatic alert when merchant approaches economic nexus threshold in new state\n- Transmits active nexus jurisdictions to automated tax calculation engine", "TODO", "HIGH", "usr_felix", "cycle_cp_26", "ms_pilot"),
        ("Build merchant shipping zone and flat-rate rule matrix configurator", "Configure geographic shipping zones and custom rate tables per country/region.\n\n### Acceptance Criteria\n- Define domestic, regional, and international shipping zones\n- Configure flat-rate shipping tiers, free shipping thresholds, and weight tables\n- Supports postal code exclusion zones for remote island or territory delivery\n- Rule simulator tests rate calculations against sample test addresses", "TODO", "MEDIUM", "usr_diego", "cycle_cp_26", "ms_pilot"),
        ("Implement multi-currency bank account payout settings and statement download", "Manage merchant bank account routing details for international sales deposits.\n\n### Acceptance Criteria\n- Add and verify bank accounts via micro-deposits or Stripe Financial Connections\n- Configure daily, weekly, or monthly payout schedule\n- Itemized payout statement PDF and CSV downloads for accounting reconciliation\n- Two-factor authentication required before editing bank payout routing details", "TODO", "HIGH", "usr_felix", "cycle_cp_26", "ms_pilot"),
        ("Build merchant product review moderation tool with spam filtering", "Moderate customer submitted reviews before publication on product pages.\n\n### Acceptance Criteria\n- Queue displaying pending, published, and rejected customer reviews\n- Automated profanity and spam filter flags suspicious submissions\n- Merchant staff public reply capability displayed under review\n- Batch approve or reject actions for rapid review processing", "TODO", "LOW", "usr_maya", "cycle_cp_26", "ms_pilot"),
        ("Implement merchant custom email template editor with preview simulation", "Empower merchants to customize HTML email layouts and brand messaging.\n\n### Acceptance Criteria\n- Visual drag-and-drop block editor for email header, body, buttons, and footer\n- Variable insertion tool (e.g. `{{customer.name}}`, `{{order.number}}`)\n- Live preview toggle for desktop and mobile screen widths\n- Send test email to administrator inbox before saving template changes", "BACKLOG", "MEDIUM", "usr_chloe", None, "ms_ga"),
        ("Build store navigation menu drag-and-drop hierarchy editor", "Configure multi-level storefront navigation menus and footer link columns.\n\n### Acceptance Criteria\n- Drag-and-drop tree interface for reordering header menu items\n- Supports dropdown mega-menus with nested subcategories up to 3 levels\n- Add custom URLs, category links, or collection pages\n- Instant preview in theme visualizer", "BACKLOG", "LOW", "usr_jordan", None, "ms_ga"),
        ("Implement merchant sales tax liability report for quarterly financial filings", "Generate itemized tax liability reports partitioned by jurisdiction.\n\n### Acceptance Criteria\n- Aggregates taxable sales, exempt sales, and tax collected per state and county\n- Formatted to match California CDTFA, New York NYSDTF, and Texas Comptroller filing forms\n- Reconciles tax collected against payment gateway ledger balances\n- Export to formatted Excel and PDF filing workbooks", "BACKLOG", "MEDIUM", "usr_felix", None, "ms_ga"),
        ("Build merchant inventory valuation report (FIFO / Weighted Average Cost)", "Calculate current total asset valuation of warehouse inventory on hand.\n\n### Acceptance Criteria\n- Supports First-In First-Out (FIFO) and Weighted Average Cost accounting models\n- Reports total units, unit cost, and extended inventory asset value per SKU\n- Filterable by warehouse location and product category\n- Certified audit output compliant with GAAP and IFRS financial standards", "BACKLOG", "HIGH", "usr_samira", None, "ms_ga"),
        ("Implement multi-location retail POS integration synchronization hub", "Connect physical retail brick-and-mortar point-of-sale registers to NEXUS.\n\n### Acceptance Criteria\n- Ingests in-person store transactions via POS webhook API\n- Deducts physical store stock immediately from unified inventory balance\n- Supports 'Buy Online, Pick Up in Store' (BOPIS) fulfillment flow\n- Unified customer profile merges in-store and online purchase history", "BACKLOG", "HIGH", "usr_diego", None, "ms_ga"),
        ("Build merchant API rate limit usage and quota monitoring dashboard", "Provide merchant developers with real-time API call volume and quota metrics.\n\n### Acceptance Criteria\n- Graphs requests per minute (RPM) against provisioned tier quota\n- Displays breakdown of API calls by endpoint and response status code\n- Alerts merchant admin when API usage reaches 85% of monthly allowance\n- Provides rate-limiting troubleshooting guidance and header documentation", "CANCELLED", "LOW", "usr_tariq", None, "ms_ga"),
        ("Audit merchant backoffice response times on 100,000 order historical accounts", "Verify that merchant dashboard maintains sub-second query speeds on enterprise datasets.\n\n### Acceptance Criteria\n- Test database loaded with 100,000 orders and 50,000 customer records\n- Order list page load p95 latency remains under 450ms\n- Customer search returns matching records in under 200ms\n- SQL query execution plans audited for index coverage and sequential scan elimination", "IN_PROGRESS", "URGENT", "usr_devon", "cycle_cp_25", "ms_pilot"),
        ("Finalize merchant administration end-to-end regression validation tests", "Automated Playwright test suite validating all merchant backoffice administrative workflows.\n\n### Acceptance Criteria\n- Tests store configuration updates, staff invites, catalog edits, and order management\n- Validates role-based permission enforcement across admin user tiers\n- Zero test failures across 40 automated test scenarios\n- Test suite executes in under 90 seconds in CI/CD pipeline", "IN_PROGRESS", "HIGH", "usr_hannah", "cycle_cp_25", "ms_pilot"),
    ],

    # Workstream 11: Security & Compliance Engineering (NEX-235 to NEX-256)
    [
        ("Implement PCI-DSS Level 1 compliance attestation security controls", "Enforce technical and administrative controls mandated by PCI-DSS v4.0.\n\n### Acceptance Criteria\n- Zero credit card primary account numbers (PAN) stored on application disks\n- Network segmentation isolates payment proxy components in dedicated subnet\n- Annual Attestation of Compliance (AoC) package generated for QSA auditor\n- Quarterly external ASV vulnerability scans pass with zero high-severity findings", "DONE", "URGENT", "usr_vikram", "cycle_cp_22", "ms_arch"),
        ("Build SOC2 Type II automated audit evidence collector across cloud resources", "Automate evidence collection proving continuous operation of security controls.\n\n### Acceptance Criteria\n- Ingests cloud configuration snapshots verifying encryption, MFA, and access logs\n- Connects with Vanta/Drata compliance automation platforms via API\n- Generates daily compliance status report with automated alerting on control drift\n- Reduces manual audit preparation time by 80%", "DONE", "HIGH", "usr_artur", "cycle_cp_22", "ms_arch"),
        ("Implement GDPR and CCPA 'Right to be Forgotten' customer data eraser job", "Orchestrate asynchronous pseudonymization and deletion of customer personal data.\n\n### Acceptance Criteria\n- Deletes customer records across 14 database tables within 30 days of request\n- Retains anonymized financial transaction entries for statutory tax requirements\n- Dispatches data erasure webhooks to third-party marketing and analytics platforms\n- Generates cryptographic receipt certifying completion of erasure request", "DONE", "HIGH", "usr_artur", "cycle_cp_22", "ms_arch"),
        ("Build PII data masking filter for application logs and OpenTelemetry spans", "Sanitize sensitive customer credentials and personally identifiable data from logs.\n\n### Acceptance Criteria\n- Regex filter redacts credit cards, passwords, SSNs, and email addresses\n- Masks sensitive payload fields before transmission to Datadog and CloudWatch\n- Zero performance degradation: filtering overhead under 0.1ms per log line\n- Automated scanner alerts security team if unmasked PII pattern detected in logs", "DONE", "URGENT", "usr_vikram", "cycle_cp_22", "ms_arch"),
        ("Implement automated database column-level encryption for customer credit tokens", "Encrypt customer payment tokens and sensitive secrets using AES-256-GCM.\n\n### Acceptance Criteria\n- Column-level encryption transparently applied via database ORM hooks\n- Envelope encryption with key derivation from AWS KMS master key\n- Unique initialization vector (IV) generated per encrypted record\n- Compromised database backup yields zero readable customer tokens", "DONE", "HIGH", "usr_vikram", "cycle_cp_22", "ms_arch"),
        ("Build HashiCorp Vault dynamic database credentials rotation pipeline", "Eliminate static database credentials by generating short-lived dynamic credentials.\n\n### Acceptance Criteria\n- Microservices request database credentials from Vault with 4-hour lease TTL\n- Vault automatically creates and revokes PostgreSQL users on lease expiry\n- Automated credential renewal heartbeats run in application background\n- Zero downtime during credential rotation cycles", "DONE", "HIGH", "usr_elena", "cycle_cp_23", "ms_reliability"),
        ("Implement Web Application Firewall (WAF) OWASP Top 10 rule enforcement", "Deploy Cloudflare WAF managed rules protecting against injection and XSS.\n\n### Acceptance Criteria\n- Blocks SQL injection (SQLi), Cross-Site Scripting (XSS), and Path Traversal\n- Strict rate-limiting on sensitive endpoints (`/api/auth/*`, `/api/checkout/*`)\n- Custom firewall rules block known malicious scraper and bot ASN ranges\n- False positive rate audited and verified under 0.01% on legitimate checkout traffic", "DONE", "URGENT", "usr_vikram", "cycle_cp_23", "ms_reliability"),
        ("Build DDOS mitigation rate-limit policies on public customer endpoints", "Protect public storefront endpoints from volumetric denial-of-service attacks.\n\n### Acceptance Criteria\n- Cloudflare Edge rate limiting blocks IPs exceeding 120 requests/minute\n- Challenge solve required when traffic score indicates automated bot behavior\n- Whitelist support for certified search engine crawlers (Googlebot, Bingbot)\n- Storefront availability remains 100% during simulated 50,000 RPS SYN flood", "DONE", "HIGH", "usr_elena", "cycle_cp_23", "ms_reliability"),
        ("Implement Content Security Policy (CSP) headers with strict nonce verification", "Mitigate client-side cross-site scripting by enforcing strict browser CSP.\n\n### Acceptance Criteria\n- Server generates cryptographically random base64 nonce per HTML page load\n- `Content-Security-Policy` header restricts script execution to nonced tags\n- Disallows `unsafe-inline` and `unsafe-eval` script execution\n- CSP violation reports streamed to security monitoring endpoint", "IN_PROGRESS", "MEDIUM", "usr_alex", "cycle_cp_25", "ms_payments"),
        ("Build Subresource Integrity (SRI) hash verification for third-party scripts", "Ensure third-party CDN scripts cannot be tampered with to inject malicious code.\n\n### Acceptance Criteria\n- Generates sha384 cryptographic integrity hashes for all external scripts\n- Browser automatically blocks execution if remote script hash mismatches\n- Automated CI build step verifies integrity hashes before production deployment\n- Prevents Magecart and supply-chain digital skimming attacks", "IN_PROGRESS", "HIGH", "usr_alex", "cycle_cp_25", "ms_payments"),
        ("Implement cross-site request forgery (CSRF) double-submit cookie validation", "Protect state-changing API endpoints from unauthorized cross-origin requests.\n\n### Acceptance Criteria\n- Fastify middleware checks CSRF token header against cryptographically signed cookie\n- Constant-time comparison prevents timing attack disclosure\n- Automatically exempts safe idempotent HTTP methods (GET, HEAD, OPTIONS)\n- Complete unit test coverage validating CSRF rejection on forged requests", "IN_PROGRESS", "HIGH", "usr_vikram", "cycle_cp_25", "ms_payments"),
        ("Build security event SIEM streaming pipeline to Datadog and Splunk", "Stream security events into centralized Security Information and Event Management.\n\n### Acceptance Criteria\n- Ingests authentication failures, privilege escalations, and WAF blocks\n- Formats events in standard Common Event Format (CEF) / ECS schema\n- Real-time alerting triggers in Slack on credential stuffing spikes\n- 90-day hot search index with 1-year cold archive for forensics", "IN_REVIEW", "MEDIUM", "usr_vikram", "cycle_cp_25", "ms_payments"),
        ("Implement container image vulnerability scanning in CI/CD pipeline using Trivy", "Scan all Docker container images for OS and package vulnerabilities before deployment.\n\n### Acceptance Criteria\n- Trivy scan executes during GitHub Actions build pipeline\n- Build immediately fails if CRITICAL or HIGH severity CVE detected\n- Generates Software Bill of Materials (SBOM) in SPDX format\n- Image signature generated with Cosign and verified by Kubernetes admission controller", "IN_REVIEW", "HIGH", "usr_amara", "cycle_cp_25", "ms_reliability"),
        ("Build automated dependency vulnerability scanning using Snyk and Dependabot", "Continuously audit npm and Python package dependencies for known vulnerabilities.\n\n### Acceptance Criteria\n- Scans dependencies on every pull request submission\n- Automated pull requests generated for security patches within 24 hours of CVE release\n- Blocks pull request merge if un-remediated vulnerability exists\n- Zero high or critical open vulnerabilities maintained across codebase", "TODO", "MEDIUM", "usr_amara", "cycle_cp_26", "ms_payments"),
        ("Implement cryptographic audit trail for customer payment transactions", "Create immutable hash chain verifying payment ledger integrity.\n\n### Acceptance Criteria\n- Each ledger record embeds SHA-256 hash of previous transaction record\n- Tampering with any historical entry invalidates entire subsequent hash chain\n- Daily root hash published to timestamp authority for external proof\n- Verification script validates hash integrity of 1,000,000 transactions in under 5s", "TODO", "HIGH", "usr_felix", "cycle_cp_26", "ms_payments"),
        ("Build merchant staff two-factor authentication mandatory enforcement policy", "Allow merchant administrators to mandate MFA for all employees in their workspace.\n\n### Acceptance Criteria\n- Setting toggle in workspace security preferences\n- Un-enrolled staff prompted to setup TOTP on next login before accessing store data\n- Admin bypass prevention: admins cannot exempt themselves from policy\n- Audit log entry records policy enablement and affected staff members", "TODO", "MEDIUM", "usr_sarah", "cycle_cp_26", "ms_payments"),
        ("Implement IP geolocation anomaly alerting for admin logins", "Detect and challenge admin logins originating from unexpected geographic regions.\n\n### Acceptance Criteria\n- Compares login IP geolocation against staff typical country and city history\n- New country triggers email verification code challenge before granting session\n- Security operations alert dispatched on login from high-risk embargoed nation\n- Staff member can inspect and approve login attempt via trusted email notification", "TODO", "LOW", "usr_vikram", "cycle_cp_26", "ms_payments"),
        ("Build automated secrets detection pre-commit hook preventing API key commits", "Block developers from accidentally committing credentials, private keys, or API tokens.\n\n### Acceptance Criteria\n- Uses Gitleaks pattern scanner in local Git pre-commit hooks and CI\n- Detects AWS keys, Stripe keys, private RSA keys, and database passwords\n- Immediate build termination if unmasked secret detected\n- Whitelist configuration for sanitized unit test fixture strings", "BACKLOG", "MEDIUM", "usr_amara", None, "ms_ga"),
        ("Implement TLS 1.3 cipher suite enforcement and deprecate legacy TLS versions", "Enforce state-of-the-art cryptographic encryption protocols across all edge proxies.\n\n### Acceptance Criteria\n- Disallows TLS 1.0, 1.1, and insecure cipher suites\n- Mandates TLS 1.2 minimum with TLS 1.3 preferred\n- Forward secrecy enabled with ECDHE key exchange\n- SSL Labs testing achieves solid A+ rating across all public domains", "BACKLOG", "HIGH", "usr_elena", None, "ms_ga"),
        ("Build annual third-party penetration testing vulnerability remediation tracker", "Track and remediate findings from annual white-box penetration test.\n\n### Acceptance Criteria\n- JIRA-compatible security remediation issue tracking\n- Strict SLAs: Critical findings resolved in 48 hours; High in 14 days\n- Re-testing verification by third-party security firm before issue closure\n- Executive remediation report signed by Chief Information Security Officer (CISO)", "BACKLOG", "HIGH", "usr_miriam", None, "ms_ga"),
        ("Audit customer cookie security flags (Secure, HttpOnly, SameSite=Strict)", "Verify all application cookies adhere to modern browser security protections.\n\n### Acceptance Criteria\n- Automated crawler inspects Set-Cookie headers across all public endpoints\n- Validates presence of `Secure`, `HttpOnly`, and `SameSite` on all session cookies\n- Zero sensitive cookies exposed to JavaScript `document.cookie` context\n- Passes automated OWASP ZAP security scan cleanly", "CANCELLED", "LOW", "usr_vikram", None, "ms_ga"),
        ("Finalize security compliance verification sign-off and report generation", "Complete comprehensive security readiness review for General Availability launch.\n\n### Acceptance Criteria\n- Consolidates PCI-DSS, SOC2, GDPR, and WAF compliance verification documentation\n- Verifies zero open Critical or High security vulnerabilities\n- Final executive sign-off signed by VP Engineering and Head of Security\n- Report archived in compliance document repository", "IN_PROGRESS", "URGENT", "usr_miriam", "cycle_cp_25", "ms_payments"),
    ],

    # Workstream 12: Infrastructure, Observability & DR (NEX-257 to NEX-278)
    [
        ("Deploy EKS Kubernetes multi-cluster architecture across us-east-1 and us-west-2", "Provision redundant production Kubernetes clusters across two AWS geographical regions.\n\n### Acceptance Criteria\n- Managed EKS control planes in us-east-1 and us-west-2\n- Worker nodes managed via Karpenter autoscaler with Spot/On-Demand mix\n- Multi-AZ worker node distribution spanning 3 availability zones per region\n- Automated cluster deployment orchestrated with Terraform and ArgoCD", "DONE", "URGENT", "usr_elena", "cycle_cp_21", "ms_reliability"),
        ("Configure OpenTelemetry Collector agent for distributed request tracing", "Deploy OpenTelemetry sidecars capturing distributed traces across microservices.\n\n### Acceptance Criteria\n- W3C Trace Context propagation across all HTTP and gRPC service hops\n- 5% probabilistic trace sampling with 100% sampling on errors and slow queries (>1s)\n- Spans include tenantId, orderId, and route metadata\n- Traces visualized in Jaeger and Datadog APM with sub-second search", "DONE", "HIGH", "usr_elena", "cycle_cp_21", "ms_reliability"),
        ("Implement Prometheus metrics scraping and Grafana dashboard suites", "Deploy monitoring infrastructure tracking system health and business KPIs.\n\n### Acceptance Criteria\n- Prometheus operator scraping `/metrics` endpoints across all pods\n- Core metrics: Request Rate, Error Rate, Duration (RED method), and CPU/RAM saturation\n- Executive Grafana dashboards for Platform, Database, and Payment Gateways\n- AlertManager alerts routed to PagerDuty and Slack engineering channels", "DONE", "HIGH", "usr_liam", "cycle_cp_21", "ms_reliability"),
        ("Build PostgreSQL Patroni high-availability cluster with automatic failover", "Deploy resilient PostgreSQL database architecture with zero-data-loss failover.\n\n### Acceptance Criteria\n- 3-node cluster managed by Patroni using etcd distributed consensus\n- Synchronous replication to one standby with asynchronous replication to DR region\n- Automated failover elects new primary in under 12 seconds upon node failure\n- Application connection pool switches to new primary automatically via virtual IP", "DONE", "URGENT", "usr_andre", "cycle_cp_24", "ms_reliability"),
        ("Implement Redis Cluster Sentinel topology for high-throughput session caching", "Deploy 6-node Redis Cluster with automatic master-replica failover.\n\n### Acceptance Criteria\n- 3 master nodes and 3 replica nodes sharded across availability zones\n- Sentinel monitoring triggers automated promotion within 3 seconds of master failure\n- Read replicas handle cache queries; masters handle write operations\n- Sustains 85,000 operations/sec in benchmark testing", "DONE", "HIGH", "usr_elena", "cycle_cp_24", "ms_reliability"),
        ("Build Kafka multi-broker event streaming cluster with 3x replication factor", "Deploy Apache Kafka messaging backbone with distributed message persistence.\n\n### Acceptance Criteria\n- 5-broker Kafka cluster with Strimzi operator on Kubernetes\n- Topics configured with replication factor of 3 and `min.insync.replicas=2`\n- Retention policy tuned to 7 days for event replay capability\n- Producer acknowledgments set to `acks=all` guaranteeing zero message loss", "DONE", "HIGH", "usr_tariq", "cycle_cp_24", "ms_reliability"),
        ("Implement Cloudflare Enterprise edge CDN caching with instant purge API", "Cache static product images, CSS, and catalog JSON payloads at global edge nodes.\n\n### Acceptance Criteria\n- Edge caching reduces origin server traffic by 78%\n- Instant cache purge API invalidates product URLs globally in under 150ms\n- Tiered Cache architecture minimizes origin connection overhead\n- Zero stale content served following product update events", "DONE", "MEDIUM", "usr_elena", "cycle_cp_24", "ms_reliability"),
        ("Build multi-region active-passive disaster recovery failover automation", "Automate complete traffic failover from primary region to standby DR region.\n\n### Acceptance Criteria\n- Route 53 DNS latency routing fails over to us-west-2 if us-east-1 unhealthy\n- Standby database promoted to read-write primary via single automated script\n- Recovery Time Objective (RTO) under 10 minutes verified in tabletop drill\n- Recovery Point Objective (RPO) under 5 seconds verified with replication telemetry", "IN_PROGRESS", "URGENT", "usr_elena", "cycle_cp_25", "ms_reliability"),
        ("Implement synthetic canary health checks probing critical checkout routes", "Continuously execute synthetic end-to-end checkout test transactions.\n\n### Acceptance Criteria\n- Headless browser script executes full checkout sequence every 60 seconds\n- Probes from 5 global AWS geographic regions\n- Immediate Sev-1 PagerDuty alert if synthetic checkout fails 2 consecutive runs\n- Diagnostic screenshots and network logs captured on test failure", "IN_PROGRESS", "HIGH", "usr_liam", "cycle_cp_25", "ms_reliability"),
        ("Build automated daily PostgreSQL database backups with point-in-time recovery", "Maintain continuous WAL archiving and automated daily snapshot backups.\n\n### Acceptance Criteria\n- Continuous Write-Ahead Log (WAL) archiving to S3 using pgBackRest\n- Point-In-Time Recovery (PITR) capable of restoring database to any second within past 30 days\n- Automated weekly test restore verifies backup validity in isolated sandbox\n- Backups encrypted with AES-256 and locked with S3 Object Lock compliance mode", "IN_PROGRESS", "HIGH", "usr_andre", "cycle_cp_25", "ms_reliability"),
        ("Implement Kubernetes Horizontal Pod Autoscaler (HPA) based on CPU and RPS", "Scale application pods automatically in response to traffic surges.\n\n### Acceptance Criteria\n- Scales pod replicas from min 5 to max 60 based on 65% CPU and custom request rate\n- Scale-up responds within 45 seconds of traffic spike onset\n- Scale-down stabilization window set to 5 minutes preventing pod thrashing\n- Successfully sustains 300% sudden traffic surge in simulation testing", "IN_PROGRESS", "MEDIUM", "usr_tomas", "cycle_cp_25", "ms_reliability"),
        ("Build centralized log aggregation using Elasticsearch, Fluentd, and Kibana (EFK)", "Collect container stdout logs across entire Kubernetes cluster in real-time.\n\n### Acceptance Criteria\n- Fluentbit daemonset streams logs from all pod nodes to Elasticsearch\n- JSON logs parsed with structured fields (level, service, traceId, message)\n- Index lifecycle management (ILM) automatically rolls over indexes daily\n- Sub-second log search query response across past 14 days of logs", "IN_REVIEW", "MEDIUM", "usr_tomas", "cycle_cp_25", "ms_reliability"),
        ("Implement PagerDuty incident escalation policy for Sev-1 payment outages", "Route critical production alerts to on-call engineers with automated escalation.\n\n### Acceptance Criteria\n- Sev-1 alert pages primary on-call engineer via phone and push notification\n- Automatically escalates to secondary engineer if unacknowledged after 5 minutes\n- Escalates to VP Engineering if unacknowledged after 15 minutes\n- Automatic Slack incident response war room created upon alert trigger", "IN_REVIEW", "HIGH", "usr_liam", "cycle_cp_25", "ms_reliability"),
        ("Build ingress controller Envoy proxy rate-limiting and connection pooling", "Deploy high-performance Envoy gateway terminating TLS and managing connections.\n\n### Acceptance Criteria\n- HTTP/2 and gRPC connection multiplexing to upstream microservices\n- Circuit breaking limits maximum concurrent connections per upstream service\n- Local and global rate-limiting protects backend services from overload\n- TLS termination latency overhead under 0.8ms", "TODO", "HIGH", "usr_tomas", "cycle_cp_26", "ms_reliability"),
        ("Implement database connection pool optimization using PgBouncer in transaction mode", "Optimize PostgreSQL server memory by pooling thousands of client connections.\n\n### Acceptance Criteria\n- PgBouncer configured in transaction pooling mode\n- Scales up to 5,000 client connections while maintaining 50 backend database sockets\n- Reduces PostgreSQL backend process memory consumption by 70%\n- Benchmarked under 20,000 queries/sec with zero connection dropouts", "TODO", "HIGH", "usr_andre", "cycle_cp_26", "ms_reliability"),
        ("Build Terraform infrastructure-as-code modules for reproducible staging environments", "Standardize cloud infrastructure components in modular reusable Terraform code.\n\n### Acceptance Criteria\n- Parameterized modules for VPC, EKS, RDS, Redis, and Cloudflare resources\n- Remote state locking using S3 and DynamoDB\n- Ephemeral staging environments can be provisioned and destroyed in under 35 minutes\n- TFLint and Checkov security policies enforce cloud compliance best practices", "TODO", "MEDIUM", "usr_amara", "cycle_cp_26", "ms_reliability"),
        ("Implement AWS S3 lifecycle policies archiving customer invoices to Glacier", "Reduce long-term cloud storage costs by transitioning old assets to Glacier.\n\n### Acceptance Criteria\n- Moves customer invoices and receipt PDFs to Glacier Instant Retrieval after 90 days\n- Moves raw application log archives to Glacier Deep Archive after 365 days\n- Reduces monthly cloud storage expenditure by estimated 62%\n- Retrieval requests complete within standard statutory audit SLAs", "TODO", "LOW", "usr_amara", "cycle_cp_26", "ms_reliability"),
        ("Build zero-downtime rolling deployment pipeline with automated blue-green cutover", "Deploy software releases without dropping a single active customer HTTP socket.\n\n### Acceptance Criteria\n- Blue-green deployment strategy managed by Argo Rollouts\n- 10% canary traffic evaluation window checking HTTP 5xx error rate\n- Automatic rollback triggered if canary error rate exceeds 0.5%\n- Zero dropped customer requests during 10 consecutive production deployments", "TODO", "URGENT", "usr_elena", "cycle_cp_26", "ms_reliability"),
        ("Implement egress network security policies isolating payment gateway proxies", "Restrict outbound network communication from Kubernetes pods to authorized destinations.\n\n### Acceptance Criteria\n- Calico network policies enforce strict default-deny egress rule\n- Payment proxy pods permitted outbound connections only to verified gateway CIDRs\n- Blocks unauthorized egress to prevent data exfiltration in event of pod breach\n- Egress connection attempts logged and audited daily", "BACKLOG", "HIGH", "usr_tomas", None, "ms_reliability"),
        ("Build DNS failover latency routing using AWS Route 53 health checks", "Route international customers to geographically closest operational AWS region.\n\n### Acceptance Criteria\n- Route 53 latency-based routing balances traffic between US and Europe origins\n- Health checks probe origin status every 10 seconds\n- Automatic DNS failover redirects traffic within 30 seconds of origin failure\n- TTL on public DNS records set to 60 seconds", "BACKLOG", "MEDIUM", "usr_liam", None, "ms_reliability"),
        ("Conduct full disaster recovery tabletop simulation measuring RTO and RPO", "Execute live simulated catastrophic cloud outage drill with engineering leadership.\n\n### Acceptance Criteria\n- Simulated total loss of AWS us-east-1 primary region\n- Measure actual RTO against 10-minute SLA and actual RPO against 5-second SLA\n- Verify customer checkout resumes successfully in us-west-2 backup region\n- Document findings and post-mortem action items in disaster recovery register", "BACKLOG", "HIGH", "usr_elena", None, "ms_reliability"),
        ("Finalize infrastructure and reliability operational readiness review (ORR)", "Execute operational checklist certifying platform readiness for high-scale launch.\n\n### Acceptance Criteria\n- Verifies all monitoring alerts, runbooks, backup tests, and on-call rotations\n- Disaster recovery sign-off approved by VP Engineering and Principal Architect\n- Production capacity certified for 15,000 concurrent active shopping sessions\n- Operational Readiness Review sign-off document published", "IN_PROGRESS", "URGENT", "usr_elena", "cycle_cp_25", "ms_reliability"),
    ],

    # Workstream 13: Automated Testing & Launch Readiness (NEX-279 to NEX-300)
    [
        ("Build end-to-end customer checkout regression test suite using Playwright", "Automate complete customer purchase flow verification across multiple devices.\n\n### Acceptance Criteria\n- Tests: Search Product -> Add to Cart -> Enter Shipping -> Submit Payment -> View Receipt\n- Runs headlessly in parallel across Chromium, Firefox, and WebKit engines\n- Interacts with real mocked payment gateways without flaky timing delays\n- Test suite executes in under 90 seconds in CI/CD matrix", "DONE", "HIGH", "usr_aisha", "cycle_cp_25", "ms_rc"),
        ("Implement synthetic payment gateway mock server simulating edge failures", "Create high-fidelity mock server for payment gateway integration tests.\n\n### Acceptance Criteria\n- Mocks Stripe, Adyen, and PayPal API contracts with realistic response delays\n- Configurable test triggers via card numbers (Decline, 3DS Challenge, Network Timeout)\n- Zero dependency on external third-party test sandboxes during CI test runs\n- Supports high-concurrency test suites running up to 500 RPS", "DONE", "HIGH", "usr_lucas", "cycle_cp_25", "ms_rc"),
        ("Build high-concurrency peak load test suite (10,000 RPS via k6)", "Stress test full eCommerce platform under simulated Black Friday peak load.\n\n### Acceptance Criteria\n- Distributed k6 load generator simulating 10,000 requests/second\n- Traffic mix: 70% Browse/Search, 20% Cart Mutations, 10% Checkout/Payment\n- p95 response time across entire platform remains under 120ms\n- Identifies system bottlenecks and verifies auto-scaling response", "DONE", "URGENT", "usr_devon", "cycle_cp_25", "ms_rc"),
        ("Implement contract test validation suite for microservice REST and gRPC APIs", "Enforce API schema contracts between frontend and backend services using Pact.\n\n### Acceptance Criteria\n- Consumer-driven contract tests for all REST and gRPC service boundaries\n- Prevents breaking API schema changes from merging into main branch\n- Validates request payload structures, required headers, and error formats\n- Runs automatically in pre-merge verification pipeline", "IN_PROGRESS", "MEDIUM", "usr_aisha", "cycle_cp_25", "ms_rc"),
        ("Build visual regression testing suite with Percy for responsive storefront layouts", "Detect unintended UI layout shifts and styling bugs across viewport breakpoints.\n\n### Acceptance Criteria\n- Captures DOM screenshots at 390px, 768px, 1024px, and 1440px viewports\n- Automated pixel-diff comparison against approved baseline snapshots\n- Flags visual discrepancies for design team review before merge\n- Zero unapproved visual regressions permitted in production builds", "IN_PROGRESS", "MEDIUM", "usr_hannah", "cycle_cp_25", "ms_rc"),
        ("Implement chaos engineering experiments injecting latency into inventory service", "Verify system resilience when downstream microservices degrade or fail.\n\n### Acceptance Criteria\n- Chaos Mesh injects 2,000ms latency and 25% packet loss into inventory service\n- Verifies checkout service degrades gracefully without throwing unhandled exceptions\n- Circuit breaker trips cleanly and displays cached stock levels to customer\n- Automated test verifies recovery within 15 seconds of chaos removal", "IN_PROGRESS", "HIGH", "usr_brendan", "cycle_cp_25", "ms_rc"),
        ("Build cross-browser testing matrix validating Safari, Chrome, Firefox, and Edge", "Verify customer storefront rendering and JavaScript execution across major browsers.\n\n### Acceptance Criteria\n- Automated Playwright runs across latest 2 versions of Safari, Chrome, Firefox, Edge\n- Validates CSS Grid and Flexbox alignment across rendering engines\n- Verifies web storage, cookie handling, and payment wallet buttons operate properly\n- Zero browser-specific JavaScript console errors recorded", "IN_REVIEW", "MEDIUM", "usr_lucas", "cycle_cp_25", "ms_rc"),
        ("Implement mobile device emulation tests across iOS Safari and Android Chrome", "Test touch gestures, responsive drawers, and viewport scaling on mobile devices.\n\n### Acceptance Criteria\n- Emulates iPhone 15 Pro (iOS Safari) and Samsung Galaxy S24 (Android Chrome)\n- Validates touch targets meet minimum 44x44px accessible size requirement\n- Cart drawer smooth swipe-to-dismiss gesture operates at 60 FPS\n- Zero horizontal page overflow or viewport pinch-zoom layout distortion", "IN_REVIEW", "HIGH", "usr_hannah", "cycle_cp_25", "ms_rc"),
        ("Build automated accessibility audit (a11y) using axe-core in CI/CD pipeline", "Continuously test storefront and checkout against WCAG 2.1 Level AA rules.\n\n### Acceptance Criteria\n- axe-core scanner runs against all major page layouts during pull request build\n- Checks color contrast, ARIA landmarks, form labels, and focus indicators\n- Blocks merge if any accessibility violation detected\n- Full accessibility audit report archived in quality portal", "TODO", "MEDIUM", "usr_aisha", "cycle_cp_26", "ms_rc"),
        ("Implement database migration rollback safety verification in automated test runner", "Verify that every database schema migration can be rolled back cleanly.\n\n### Acceptance Criteria\n- Test runner applies migration up, validates schema, then applies down migration\n- Verifies database returns to exact original schema state without data corruption\n- Blocks deployment if migration down script fails or causes data loss\n- All database migrations tested against realistic 10,000 row staging dataset", "TODO", "HIGH", "usr_andre", "cycle_cp_26", "ms_rc"),
        ("Build synthetic order generation pipeline for staging environment load testing", "Populate staging environment with realistic synthetic customer order histories.\n\n### Acceptance Criteria\n- Generates 25,000 realistic orders with diverse items, addresses, and payment methods\n- Maintains authentic order status distribution (Paid, Fulfilled, Returned)\n- Preserves referential integrity across products, customers, and inventory tables\n- Script runs and seeds complete staging database in under 3 minutes", "TODO", "MEDIUM", "usr_lucas", "cycle_cp_26", "ms_rc"),
        ("Implement international storefront localization test suite for currency and date formats", "Verify storefront formatting across international currencies, dates, and number formats.\n\n### Acceptance Criteria\n- Validates currency formatting for 15 global markets (USD, EUR, GBP, JPY, CAD, AUD)\n- Verifies date layouts (DD/MM/YYYY vs MM/DD/YYYY) match destination locale\n- Tests RTL (Right-to-Left) layout mirroring for Arabic storefront\n- Zero untranslated fallback strings visible in customer UI", "TODO", "LOW", "usr_sofia", "cycle_cp_26", "ms_rc"),
        ("Build payment gateway webhook replay and fuzzing security test suite", "Stress test webhook handlers with malformed payloads and out-of-order deliveries.\n\n### Acceptance Criteria\n- Fuzzes webhook endpoint with invalid signatures, truncated payloads, and corrupted JSON\n- Replays identical webhook 100 times to test deduplication idempotency\n- Injects events out of chronological sequence (Refunded before Paid)\n- System maintains 100% financial state consistency without crashing", "TODO", "URGENT", "usr_brendan", "cycle_cp_26", "ms_rc"),
        ("Implement search relevance regression test suite verifying product ranking stability", "Ensure algorithm tweaks do not unintentionally degrade search result quality.\n\n### Acceptance Criteria\n- Evaluates top 200 standard search queries against golden expectation rankings\n- Computes Normalized Discounted Cumulative Gain (NDCG@10) score\n- Alerts search engineering team if relevance score drops by more than 2%\n- Automated test executes on every search analyzer configuration commit", "TODO", "MEDIUM", "usr_nadia", "cycle_cp_26", "ms_rc"),
        ("Build customer cart concurrency race condition test with parallel checkouts", "Verify cart consistency when customer clicks checkout in multiple tabs concurrently.\n\n### Acceptance Criteria\n- Spawns 20 parallel threads attempting to submit order for single cart simultaneously\n- Optimistic concurrency control guarantees exactly 1 order created\n- Remaining 19 requests receive clean 409 Conflict or cached order response\n- Zero duplicate credit card charges or double-decremented inventory", "BACKLOG", "HIGH", "usr_devon", None, "ms_pilot"),
        ("Implement merchant administration backoffice smoke test suite", "Execute critical path smoke tests validating merchant administration tools.\n\n### Acceptance Criteria\n- Verifies catalog item creation, inventory adjustments, and order status updates\n- Tests merchant staff invite creation and role assignment dropdowns\n- Runs headlessly in under 40 seconds before production deployments\n- Immediate Slack alert if any backoffice smoke test fails", "BACKLOG", "MEDIUM", "usr_lucas", None, "ms_pilot"),
        ("Build staging environment automated data sanitization and seed restoration script", "Clean and reset staging environment to pristine baseline state.\n\n### Acceptance Criteria\n- Wipes staging databases and restores canonical NEXUS enterprise fixture data\n- Scrubs customer PII and resets demo credentials\n- Warms Redis cache and rebuilds OpenSearch indices\n- Complete staging environment reset executes in under 90 seconds", "BACKLOG", "LOW", "usr_brendan", None, "ms_pilot"),
        ("Establish release qualification readiness checklist and automated health gates", "Formalize go/no-go quality gates for production software deployment.\n\n### Acceptance Criteria\n- Automated pipeline checks test pass rate, code coverage (>85%), and zero CVEs\n- Verifies performance SLA thresholds met in load testing\n- Requires explicit sign-off approvals from QA Lead, Platform Lead, and Security Lead\n- Blocks release branch promotion until all automated gates pass green", "TODO", "URGENT", "usr_brendan", "cycle_cp_26", "ms_pilot"),
        ("Conduct merchant pilot canary deployment verification with top 10 merchants", "Monitor platform behavior during initial phased rollout to flagship merchant cohort.\n\n### Acceptance Criteria\n- Routes 5% of production traffic to new version for top 10 merchant stores\n- Monitors error rate, order completion rate, and p95 latency for 48 hours\n- Zero critical defects reported by pilot merchant store managers\n- Phased traffic ramp to 25%, 50%, and 100% following canary sign-off", "TODO", "URGENT", "usr_rachel", "cycle_cp_27", "ms_pilot"),
        ("Build production launch runbook with rollback procedures and on-call schedule", "Document step-by-step procedures for live cutover and emergency rollback.\n\n### Acceptance Criteria\n- Step-by-step launch timeline with assigned owner for every operational step\n- Documented rollback criteria and command-line execution steps\n- 24/7 on-call engineer schedule spanning all 6 functional teams\n- Emergency conference bridge and executive escalation paths established", "BACKLOG", "HIGH", "usr_sarah", None, "ms_ga"),
        ("Verify telemetry and real-time business dashboards during 24-hour pilot run", "Audit live telemetry during 24-hour continuous merchant pilot execution.\n\n### Acceptance Criteria\n- Real-time revenue, order rate, and latency dashboards monitored continuously\n- Database CPU utilization remains below 45% throughout pilot duration\n- Zero unhandled exception spikes or memory leak trajectories observed\n- Performance observations report compiled and published to engineering wiki", "BACKLOG", "HIGH", "usr_devon", None, "ms_ga"),
        ("Execute final General Availability (GA) launch sign-off across all 6 functional teams", "Formal operational launch ceremony transition to General Availability.\n\n### Acceptance Criteria\n- Unanimous launch sign-off from Leads of all 6 Functional Teams\n- Customer support team trained and ready with standard operating procedures\n- Public marketing announcement and documentation published\n- NEXUS Omnichannel Commerce Platform officially declared live in General Availability", "BACKLOG", "URGENT", "usr_sarah", None, "ms_ga"),
    ]
]

# Build 300 issues
ISSUES = []
issue_counter = 1

for ws_idx, ws_issues in enumerate(WORKSTREAM_DATA):
    ws_info = [
        {"name": "Identity, accounts and permissions", "milestoneId": "ms_arch"},
        {"name": "Product catalog and merchandising", "milestoneId": "ms_catalog"},
        {"name": "Search and discovery", "milestoneId": "ms_search"},
        {"name": "Cart and checkout", "milestoneId": "ms_checkout"},
        {"name": "Payments and refunds", "milestoneId": "ms_payments"},
        {"name": "Orders and returns", "milestoneId": "ms_fulfillment"},
        {"name": "Inventory and warehouse synchronization", "milestoneId": "ms_fulfillment"},
        {"name": "Shipping and fulfillment", "milestoneId": "ms_fulfillment"},
        {"name": "Customer notifications", "milestoneId": "ms_checkout"},
        {"name": "Merchant administration", "milestoneId": "ms_pilot"},
        {"name": "Security and compliance engineering", "milestoneId": "ms_payments"},
        {"name": "Infrastructure, observability and disaster recovery", "milestoneId": "ms_reliability"},
        {"name": "Automated testing and launch readiness", "milestoneId": "ms_rc"},
    ][ws_idx]

    for title, desc, state, priority, assignee, cycle, milestone in ws_issues:
        num = issue_counter
        issue_id = f"iss_nex_{num}"
        key = f"NEX-{num}"

        # Deterministic dates around reference date 2026-10-08
        if state == "DONE" or state == "CANCELLED":
            created_at = "2026-08-05T09:00:00.000Z" if num < 100 else "2026-09-01T10:00:00.000Z"
            updated_at = "2026-08-28T16:00:00.000Z" if num < 100 else "2026-09-26T17:00:00.000Z"
            start_date = "2026-08-05" if num < 100 else "2026-09-01"
            due_date = "2026-08-25" if num < 100 else "2026-09-25"
        elif state == "IN_PROGRESS" or state == "IN_REVIEW":
            created_at = "2026-09-28T09:30:00.000Z"
            updated_at = "2026-10-07T14:15:00.000Z"
            start_date = "2026-09-28"
            # Some are overdue (e.g. num % 7 == 0 has due_date 2026-10-05)
            due_date = "2026-10-05" if (num % 6 == 0) else "2026-10-11"
        else: # TODO / BACKLOG
            created_at = "2026-10-01T11:00:00.000Z"
            updated_at = "2026-10-06T10:00:00.000Z"
            start_date = "2026-10-12" if cycle == "cycle_cp_26" else None
            due_date = "2026-10-25" if cycle == "cycle_cp_26" else None

        # Some backlog items unassigned
        eff_assignee = None if (state == "BACKLOG" and num % 2 == 0) else assignee
        creator = "usr_sarah" if num % 3 == 0 else ("usr_alex" if num % 2 == 0 else "usr_rachel")

        issue = {
            "id": issue_id,
            "workspaceId": "ws_nexus",
            "key": key,
            "projectId": "proj_nexus",
            "teamId": "team_cp",
            "cycleId": cycle if cycle else None,
            "milestoneId": milestone if milestone else ws_info["milestoneId"],
            "startDate": start_date,
            "dueDate": due_date,
            "title": title,
            "description": desc,
            "state": state,
            "priority": priority,
            "assigneeId": eff_assignee,
            "creatorId": creator,
            "createdAt": created_at,
            "updatedAt": updated_at,
            "version": 1,
        }
        ISSUES.append(issue)
        issue_counter += 1

assert len(ISSUES) == 300, f"Expected 300 issues, got {len(ISSUES)}"
print(f"Generated {len(ISSUES)} issues successfully.")

# Generate ~180 dependencies
# Rule: u < v guarantees DAG with 0 cycles and 0 self dependencies
# Completion guard: if v is DONE/CANCELLED, u MUST be DONE/CANCELLED.
DEPENDENCIES = []
issues_by_num = {int(i["key"].split("-")[1]): i for i in ISSUES}
state_by_num = {int(i["key"].split("-")[1]): i["state"] for i in ISSUES}

dep_pairs = set()

def add_dep(u_num, v_num):
    assert u_num < v_num, f"Cycle violation: u={u_num} >= v={v_num}"
    u_state = state_by_num[u_num]
    v_state = state_by_num[v_num]
    # Check completion guard: if downstream is DONE or CANCELLED, upstream cannot be active!
    if v_state in ("DONE", "CANCELLED"):
        if u_state not in ("DONE", "CANCELLED"):
            # Skip edge to avoid completion guard violation
            return False
    pair = (u_num, v_num)
    if pair not in dep_pairs:
        dep_pairs.add(pair)
        dep_id = f"dep_nex_{len(DEPENDENCIES) + 1}"
        DEPENDENCIES.append({
            "id": dep_id,
            "workspaceId": "ws_nexus",
            "upstreamIssueId": f"iss_nex_{u_num}",
            "downstreamIssueId": f"iss_nex_{v_num}",
            "createdAt": "2026-09-15T10:00:00.000Z",
            "createdBy": "usr_alex",
        })
        return True
    return False

# 1. Major architectural backbone chains:
# NEX-1 -> NEX-2 -> NEX-3 (Identity base, all DONE)
add_dep(1, 2)
add_dep(2, 3)
add_dep(1, 6)
add_dep(2, 7)
add_dep(5, 7)
add_dep(1, 10)
add_dep(2, 12)
add_dep(7, 13)
add_dep(7, 14)
add_dep(2, 15)
add_dep(12, 18)
add_dep(2, 21)

# High fan-out on NEX-1 (Auth code flow blocks multiple downstream features)
add_dep(1, 69)
add_dep(1, 74)
add_dep(1, 93)
add_dep(1, 211)

# 2. Catalog & Search backbone:
add_dep(23, 24)
add_dep(23, 25)
add_dep(23, 26)
add_dep(24, 27)
add_dep(24, 29)
add_dep(23, 30)
add_dep(24, 31)
add_dep(23, 32)
add_dep(23, 33)
add_dep(24, 34)
add_dep(27, 35)
add_dep(23, 41)
add_dep(26, 41)
add_dep(24, 43)

# Catalog -> Search
add_dep(23, 47)
add_dep(24, 48)
add_dep(41, 49) # CDC publisher blocks real-time search worker
add_dep(47, 48)
add_dep(47, 50)
add_dep(47, 51)
add_dep(48, 52)
add_dep(47, 53)
add_dep(47, 54)
add_dep(47, 58)
add_dep(48, 59)
add_dep(50, 68)

# High fan-out on NEX-23 (Taxonomy tree blocks search, catalog rules)
add_dep(23, 70)
add_dep(23, 144)

# 3. Cart & Checkout backbone:
add_dep(69, 70)
add_dep(70, 71)
add_dep(69, 72)
add_dep(73, 74)
add_dep(69, 74)
add_dep(70, 74)
add_dep(74, 75)
add_dep(74, 76)
add_dep(69, 77)
add_dep(70, 78)
add_dep(73, 79)
add_dep(74, 79)
add_dep(70, 82)
add_dep(82, 83)
add_dep(69, 84)
add_dep(75, 85)
add_dep(70, 86)
add_dep(74, 87)
add_dep(74, 88)
add_dep(74, 90)
add_dep(74, 92)

# High fan-out on NEX-69 (Cart state machine)
add_dep(69, 93)
add_dep(69, 119)
add_dep(69, 143)

# 4. Payments backbone:
add_dep(93, 94)
add_dep(93, 95)
add_dep(93, 96)
add_dep(94, 97)
add_dep(93, 98)
add_dep(93, 99)
add_dep(99, 100)
add_dep(93, 101)
add_dep(99, 102)
add_dep(100, 102)
add_dep(94, 103)
add_dep(101, 104)
add_dep(93, 105)
add_dep(93, 106)
add_dep(93, 107)
add_dep(94, 108)
add_dep(102, 109)
add_dep(94, 110)
add_dep(93, 111)
add_dep(100, 113)
add_dep(93, 114)
add_dep(98, 115)
add_dep(98, 116)
add_dep(93, 118)

# High fan-out on NEX-93 (Payment intent API)
add_dep(93, 119)
add_dep(93, 120)
add_dep(93, 167)
add_dep(93, 279)

# 5. Orders & Returns backbone:
add_dep(119, 120)
add_dep(119, 121)
add_dep(119, 122)
add_dep(119, 123)
add_dep(119, 124)
add_dep(124, 125)
add_dep(124, 126)
add_dep(126, 127)
add_dep(119, 128)
add_dep(119, 129)
add_dep(119, 130)
add_dep(119, 131)
add_dep(119, 132)
add_dep(122, 133)
add_dep(119, 134)
add_dep(119, 135)
add_dep(125, 136)
add_dep(124, 140)
add_dep(119, 142)

# High fan-out on NEX-119 (Order state machine blocks inventory, shipping, notifications)
add_dep(119, 143)
add_dep(119, 167)
add_dep(119, 189)
add_dep(119, 190)

# 6. Inventory backbone:
add_dep(143, 144)
add_dep(143, 145)
add_dep(144, 146)
add_dep(144, 147)
add_dep(144, 148)
add_dep(146, 149)
add_dep(144, 150)
add_dep(144, 151)
add_dep(144, 152)
add_dep(143, 153)
add_dep(144, 154)
add_dep(144, 155)
add_dep(144, 156)
add_dep(144, 157)
add_dep(144, 158)
add_dep(144, 159)
add_dep(143, 160)
add_dep(143, 166)

# High fan-out on NEX-143 (Inventory lock blocks shipping allocation)
add_dep(143, 169)
add_dep(143, 170)

# 7. Shipping backbone:
add_dep(167, 168)
add_dep(167, 169)
add_dep(169, 170)
add_dep(168, 171)
add_dep(171, 172)
add_dep(167, 173)
add_dep(168, 174)
add_dep(168, 175)
add_dep(171, 176)
add_dep(167, 177)
add_dep(167, 178)
add_dep(167, 179)
add_dep(170, 180)
add_dep(167, 188)

# 8. Notifications backbone:
add_dep(189, 190)
add_dep(189, 191)
add_dep(189, 192)
add_dep(189, 193)
add_dep(190, 194)
add_dep(189, 195)
add_dep(189, 196)
add_dep(189, 197)
add_dep(189, 198)
add_dep(189, 200)
add_dep(191, 201)
add_dep(190, 202)
add_dep(189, 203)
add_dep(193, 204)
add_dep(189, 207)
add_dep(189, 210)

# 9. Merchant Admin backbone:
add_dep(211, 212)
add_dep(211, 213)
add_dep(211, 214)
add_dep(211, 215)
add_dep(211, 216)
add_dep(211, 217)
add_dep(211, 218)
add_dep(211, 219)
add_dep(211, 220)
add_dep(211, 221)
add_dep(211, 222)
add_dep(211, 223)
add_dep(211, 224)
add_dep(211, 225)
add_dep(211, 234)

# 10. Security backbone:
add_dep(235, 236)
add_dep(235, 237)
add_dep(235, 238)
add_dep(235, 239)
add_dep(235, 240)
add_dep(235, 241)
add_dep(241, 242)
add_dep(241, 243)
add_dep(243, 244)
add_dep(241, 245)
add_dep(235, 246)
add_dep(235, 247)
add_dep(235, 248)
add_dep(239, 249)
add_dep(235, 256)

# 11. Infrastructure backbone:
add_dep(257, 258)
add_dep(257, 259)
add_dep(257, 260)
add_dep(257, 261)
add_dep(257, 262)
add_dep(257, 263)
add_dep(260, 264)
add_dep(257, 265)
add_dep(260, 266)
add_dep(257, 267)
add_dep(257, 268)
add_dep(259, 269)
add_dep(257, 270)
add_dep(260, 271)
add_dep(257, 278)

# 12. Testing & Launch backbone:
add_dep(279, 280)
add_dep(279, 281)
add_dep(279, 282)
add_dep(279, 283)
add_dep(279, 284)
add_dep(279, 285)
add_dep(279, 286)
add_dep(279, 287)
add_dep(279, 288)
add_dep(279, 289)
add_dep(279, 296)
add_dep(296, 297)
add_dep(296, 298)
add_dep(297, 299)
add_dep(298, 300)
add_dep(299, 300)

# Cross-functional enterprise integration chains:
# Identity -> Cart -> Payment -> Order -> Shipping -> Testing
add_dep(2, 69)
add_dep(15, 220)
add_dep(26, 47)
add_dep(27, 70)
add_dep(33, 144)
add_dep(48, 70)
add_dep(71, 93)
add_dep(75, 143)
add_dep(79, 167)
add_dep(97, 119)
add_dep(101, 119)
add_dep(108, 239)
add_dep(120, 143)
add_dep(120, 189)
add_dep(128, 147)
add_dep(130, 220)
add_dep(144, 169)
add_dep(145, 160)
add_dep(168, 201)
add_dep(171, 189)
add_dep(239, 256)
add_dep(260, 279)
add_dep(261, 281)
add_dep(264, 277)
add_dep(269, 298)

# Fill additional realistic edges up to ~180:
# Selected multi-blockers:
add_dep(3, 12)
add_dep(4, 13)
add_dep(6, 17)
add_dep(8, 14)
add_dep(25, 28)
add_dep(28, 38)
add_dep(29, 152)
add_dep(31, 37)
add_dep(32, 38)
add_dep(36, 198)
add_dep(49, 63)
add_dep(51, 64)
add_dep(55, 67)
add_dep(72, 89)
add_dep(76, 96)
add_dep(77, 88)
add_dep(78, 110)
add_dep(81, 195)
add_dep(83, 129)
add_dep(94, 116)
add_dep(95, 111)
add_dep(98, 139)
add_dep(104, 131)
add_dep(121, 122)
add_dep(123, 145)
add_dep(127, 207)
add_dep(137, 168)
add_dep(146, 161)
add_dep(149, 155)
add_dep(154, 174)
add_dep(157, 162)
add_dep(173, 175)
add_dep(176, 186)
add_dep(180, 184)
add_dep(192, 195)
add_dep(194, 202)


print(f"Generated {len(DEPENDENCIES)} candidate dependency edges.")
# Keep exactly 182 meaningful edges matching target (~180)
TARGET_DEP_COUNT = 182
if len(DEPENDENCIES) > TARGET_DEP_COUNT:
    DEPENDENCIES = DEPENDENCIES[:TARGET_DEP_COUNT]

print(f"Finalized {len(DEPENDENCIES)} dependency edges (target: ~180).")

# Verify DAG (no cycles, no duplicates, completion guard)
adj = {}
for dep in DEPENDENCIES:
    u = dep["upstreamIssueId"]
    v = dep["downstreamIssueId"]
    assert u != v, f"Self-dependency detected: {u}"
    if u not in adj: adj[u] = []
    adj[u].append(v)

# Check completion guards for all dependencies
for dep in DEPENDENCIES:
    u_key = dep["upstreamIssueId"].replace("iss_nex_", "")
    v_key = dep["downstreamIssueId"].replace("iss_nex_", "")
    u_state = state_by_num[int(u_key)]
    v_state = state_by_num[int(v_key)]
    if v_state in ("DONE", "CANCELLED"):
        assert u_state in ("DONE", "CANCELLED"), f"Completion guard violated: {dep['upstreamIssueId']} ({u_state}) BLOCKS {dep['downstreamIssueId']} ({v_state})"

print("All dependencies pass DAG acyclicity and Completion Guard checks.")

# Generate 420 Comments
COMMENTS = []
comment_counter = 1

comment_authors = [u["id"] for u in USERS]
names_by_id = {u["id"]: u["name"] for u in USERS}
avatars_by_id = {u["id"]: u["avatar"] for u in USERS}

# Generate rich technical comments
technical_snippets = [
    ("Verified the HMAC-SHA256 signature verification in staging. Latency overhead is under 0.8ms.", ["usr_alex"]),
    ("Ran the k6 load test with 5,000 virtual users. PgBouncer connection pool held steady with zero timeouts.", ["usr_elena"]),
    ("The Bloom filter false-positive rate is 0.01% with 2MB allocation. Proceeding with PR merge.", ["usr_david"]),
    ("Can we ensure we test token revocation when the user changes password across multiple devices?", ["usr_sarah"]),
    ("Tested the fallback circuit breaker with simulated 504 Gateway Timeouts. Rerouted cleanly to secondary provider.", ["usr_priya"]),
    ("Confirmed the OpenSearch ngram analyzer accurately tokenizes German compound nouns.", ["usr_nadia"]),
    ("Checked the Redis Redlock lease renewal worker. Leases renew at 5-second intervals as expected.", ["usr_diego"]),
    ("The carrier rate shopping service returned valid USPS and FedEx quotes in 240ms.", ["usr_diego"]),
    ("Accessibility audit passed with zero violations in axe-core automated regression run.", ["usr_marcus"]),
    ("Security audit sign-off approved. All cryptographic key rotation requirements satisfied.", ["usr_vikram"]),
    ("PR is up for review. Includes unit tests covering multi-currency edge cases and rounding.", ["usr_carlos"]),
    ("Staging deployment verified. Synthetic checkout health check is reporting green in us-east-1.", ["usr_liam"]),
    ("Added trace spans to the inventory locking coordinator so we can track lock hold duration in Datadog.", ["usr_elena"]),
    ("Please verify the 3DS challenge modal behavior on mobile viewport breakpoints before closing.", ["usr_priya"]),
    ("The double-entry ledger balance reconciled with zero variance across all simulated transactions.", ["usr_felix"]),
]

for idx in range(430):
    issue_num = (idx % 250) + 1 # Concentrate comments on issues 1-250
    issue_id = f"iss_nex_{issue_num}"
    author_id = comment_authors[idx % len(comment_authors)]
    author_name = names_by_id[author_id]
    author_avatar = avatars_by_id[author_id]
    
    snippet, mentions = technical_snippets[idx % len(technical_snippets)]
    # Target mentions to Alex and Sarah frequently
    if idx % 3 == 0:
        content = f"@{names_by_id['usr_alex']} {snippet}"
        actual_mentions = ["usr_alex"]
    elif idx % 4 == 0:
        content = f"@{names_by_id['usr_sarah']} {snippet}"
        actual_mentions = ["usr_sarah"]
    else:
        target_m = mentions[0]
        content = f"@{names_by_id[target_m]} {snippet}"
        actual_mentions = [target_m]

    parent_id = None
    if idx % 3 == 1 and idx > 0:
        parent_id = f"comm_nex_{idx}" # Threaded reply to prior comment

    comm = {
        "id": f"comm_nex_{comment_counter}",
        "workspaceId": "ws_nexus",
        "issueId": issue_id,
        "authorId": author_id,
        "authorName": author_name,
        "authorAvatar": author_avatar,
        "content": content,
        "createdAt": "2026-10-04T12:00:00.000Z",
        "parentId": parent_id,
        "mentions": actual_mentions,
    }
    COMMENTS.append(comm)
    comment_counter += 1

print(f"Generated {len(COMMENTS)} comments (target: 400+).")

# Generate 650 Activity Events
ACTIVITIES = []
act_counter = 1

# 1. ISSUE_CREATED for all 300 issues
for issue in ISSUES:
    ACTIVITIES.append({
        "id": f"act_nex_{act_counter}",
        "workspaceId": "ws_nexus",
        "issueId": issue["id"],
        "eventType": "ISSUE_CREATED",
        "userId": issue["creatorId"],
        "userName": names_by_id[issue["creatorId"]],
        "timestamp": issue["createdAt"],
        "details": {
            "targetIssueKey": issue["key"],
            "targetIssueTitle": issue["title"],
        }
    })
    act_counter += 1

# 2. STATE_CHANGED and ASSIGNEE_CHANGED transitions
for idx, issue in enumerate(ISSUES):
    if issue["state"] in ("DONE", "IN_PROGRESS", "IN_REVIEW"):
        ACTIVITIES.append({
            "id": f"act_nex_{act_counter}",
            "workspaceId": "ws_nexus",
            "issueId": issue["id"],
            "eventType": "STATE_CHANGED",
            "userId": issue["assigneeId"] or "usr_alex",
            "userName": names_by_id.get(issue["assigneeId"] or "usr_alex", "Alex Rivera"),
            "timestamp": "2026-09-29T14:00:00.000Z",
            "details": {
                "from": "TODO",
                "to": issue["state"],
                "targetIssueKey": issue["key"],
                "targetIssueTitle": issue["title"],
            }
        })
        act_counter += 1

# 3. USER_MENTIONED events for comments mentioning users
for comm in COMMENTS:
    for m_id in (comm.get("mentions") or []):
        ACTIVITIES.append({
            "id": f"act_nex_{act_counter}",
            "workspaceId": "ws_nexus",
            "issueId": comm["issueId"],
            "eventType": "USER_MENTIONED",
            "userId": comm["authorId"],
            "userName": comm["authorName"],
            "timestamp": comm["createdAt"],
            "details": {
                "commentId": comm["id"],
                "targetUserId": m_id,
                "targetUserName": names_by_id.get(m_id, "Alex Rivera"),
                "mentionedUserName": names_by_id.get(m_id, "Alex Rivera"),
                "targetIssueKey": f"NEX-{comm['issueId'].replace('iss_nex_', '')}",
            }
        })
        act_counter += 1

# 4. ISSUE_BLOCKED / ISSUE_UNBLOCKED events
for idx, dep in enumerate(DEPENDENCIES[:50]):
    down_key = dep["downstreamIssueId"].replace("iss_nex_", "")
    down_issue = issues_by_num[int(down_key)]
    ACTIVITIES.append({
        "id": f"act_nex_{act_counter}",
        "workspaceId": "ws_nexus",
        "issueId": dep["downstreamIssueId"],
        "eventType": "ISSUE_BLOCKED" if idx % 2 == 0 else "ISSUE_UNBLOCKED",
        "userId": "usr_alex",
        "userName": "Alex Rivera",
        "timestamp": "2026-10-02T10:00:00.000Z",
        "details": {
            "upstreamKey": f"NEX-{dep['upstreamIssueId'].replace('iss_nex_', '')}",
            "downstreamKey": down_issue["key"],
            "targetIssueKey": down_issue["key"],
        }
    })
    act_counter += 1

print(f"Generated {len(ACTIVITIES)} activity events (target: 600+).")

# Write out TypeScript modules
def write_ts_file(filename, var_name, type_name, data):
    file_path = os.path.join(OUT_DIR, filename)
    cleaned_data = []
    for item in data:
        if isinstance(item, dict):
            cleaned_data.append({k: v for k, v in item.items() if v is not None})
        else:
            cleaned_data.append(item)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(f"/**\n * NEXUS Enterprise Fixtures: {var_name}\n */\n")
        f.write(f"import {{ {type_name} }} from '../../types';\n\n")
        f.write(f"export const {var_name}: {type_name}[] = {json.dumps(cleaned_data, indent=2)};\n")
    print(f"Wrote {file_path}")

write_ts_file("teams.ts", "NEXUS_TEAMS", "Team", TEAMS)
write_ts_file("users.ts", "NEXUS_USERS", "User", USERS)
write_ts_file("cycles.ts", "NEXUS_CYCLES", "Cycle", CYCLES)
write_ts_file("milestones.ts", "NEXUS_MILESTONES", "Milestone", MILESTONES)
write_ts_file("issues.ts", "NEXUS_ISSUES", "Issue", ISSUES)
write_ts_file("dependencies.ts", "NEXUS_DEPENDENCIES", "Dependency", DEPENDENCIES)
write_ts_file("comments.ts", "NEXUS_COMMENTS", "IssueComment", COMMENTS)
write_ts_file("activities.ts", "NEXUS_ACTIVITIES", "ActivityEvent", ACTIVITIES)

# Write project.ts (single Project entity)
with open(os.path.join(OUT_DIR, "project.ts"), "w", encoding="utf-8") as f:
    f.write("/**\n * NEXUS Enterprise Flagship Project\n */\n")
    f.write("import { Project } from '../../types';\n\n")
    f.write(f"export const NEXUS_PROJECT: Project = {json.dumps(PROJECT, indent=2)};\n")
    f.write("export const NEXUS_PROJECTS: Project[] = [NEXUS_PROJECT];\n")

# Write index.ts
with open(os.path.join(OUT_DIR, "index.ts"), "w", encoding="utf-8") as f:
    f.write("""/**
 * NEXUS Omnichannel Commerce Platform — Enterprise Dataset
 * Canonical deterministic fixture pack.
 */

export const NEXUS_FIXTURE_VERSION = 'nexus-2026.10.1';

export * from './teams';
export * from './project';
export * from './users';
export * from './cycles';
export * from './milestones';
export * from './issues';
export * from './dependencies';
export * from './comments';
export * from './activities';

export const NEXUS_WORKSPACE = {
  id: 'ws_nexus',
  name: 'NEXUS Commerce',
  slug: 'nexus-commerce',
  avatar: '🛍️',
  createdAt: '2026-04-01T08:00:00.000Z',
  status: 'ACTIVE' as const,
};
""")

print("NEXUS Enterprise Dataset generated and saved successfully!")
