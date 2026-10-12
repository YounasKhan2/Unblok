# Bounded dependency graph design

Proposed only. Existing dependency SQL write gate remains closed. [Registry](registry.json) defines both project-root and issue-root read proposals with identical boundaries.

## Read work and correctness

Require explicit workspace and authorized project/issue root. Project query chooses≤20authorized seeds by creation/id order, not every issue. Optional≤20seed IDs must belong to the root. Direction upstream/downstream/both,depth1–3,nodes1–200,edges1–400. Work also bounded:≤2000inspected edges,≤500frontier entries,≤12business SQL statements; proposed500ms DB/750ms handler acknowledgement. Response cap alone is insufficient against a hub with millions of edges.

Deterministic breadth-first frontier `(depth,sourceId,targetId,edgeId)`; dedupe tenant-composite IDs and visited nodes. Fetch bounded adjacency chunks and bulk projections, not a full-network recursive CTE followed by LIMIT or N+1 per node. Deadline/candidate limit stops expansion even with few visible results. Valid incomplete result has `completeness:truncated`,reason BUDGET and resumable cursor; dependency/unknown query outcome503. Persisted cycles yield unavailable analysis and generic integrity incident rather than recursion failure. Truncated display traversal never proves acyclicity, global longest chain, unblocked completion or exact impact.

Authoritative blockers/completion/impact require separate database-owned queries and explicit completeness. If true validation cannot finish within work budget, mutation fails closed. A client layout or partial graph cannot authorize completion or link creation.

## Continuation and viewport

Cursor binds actor,scope,root,filters,direction,projection,data and authorization revisions. Proposed dedicated Valkey traversal state: random handle,frontier≤500,visited≤1000,2minute TTL; token holds only signed handle/bindings, not a giant frontier. Loss/expiry causes503or409CURSOR_STALE, never false completion. Relevant mutations/revocations invalidate continuation. Each page freshly checks session and primary/team/resource authority. Stable graph/policy revision records **do not exist today**; review them before enabling this continuation contract. No serializable principal or cached grant.

Current fixture graph layout uses full local filtered edges; there are no persisted coordinates. Initial live design uses bounded root/depth expansion and local layout. Actual viewport query waits for reviewed bounded layout snapshots keyed by graph/filter revision. Registry Viewport specifies integer x/y within±1000000,width/height1–10000 and required layoutRevision; it is enabled only with the reviewed snapshot capability. Rectangle is a finite bounded UI hint, never permission; intersect authorized root snapshot, cap nodes/edges, use revision-pinned positions. No claim of current spatial index or whole-network layout. Cursor expansion merges IDs; no hidden edge identifiers.

## Cross-team disclosure and later writes

Authorize both endpoints before showing an edge. Hidden IDs/titles/team names/counts cannot leak. Hidden prerequisites must not make a visible issue appear unblocked. Whether generic restricted-blocker state is permissible disclosure requires human approval; until then do not enable affected projections. Demo cross-team matrix stays untouched; cross-workspace edges remain forbidden by composite FKs.

Later add/remove needs exact grants for both endpoints, graph revision/idempotency and user→family→workspace→graph→sortedresource locks, complete authoritative reachability, opposing-edge and blocked-completion race tests. Conflicts/work exhaustion refuse mutation. No approximate cycle check/cache authority/background unchecked insertion. Replacing the SQL gate requires separate reviewed migration; no dependency write route is certified here.

GraphImpact reports observed visible nodes/edges only with partial/unavailable completeness; it is not total downstream impact, and carries no hidden counts. A separately reviewed authoritative impact projection must bound work and prove completeness or return unavailable, never derive a global total from GraphImpact.
