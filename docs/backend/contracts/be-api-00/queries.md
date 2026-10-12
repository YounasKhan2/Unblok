# PostgreSQL query and index proposal

Baseline PostgreSQL17.6/Prisma6.19.3. No SQL/index executed here. Schema and current tenancy/fence code take precedence. All business persistence stays in narrow approved database methods with primary fences and tenant composite joins; no raw delegate handed to features.

| Query | Existing support | Candidate / verification obligation |
| --- | --- | --- |
| Workspace switcher | membership(user_id,status,workspace_id),workspace PK | page membership workspace_id and bounded join; test1000memberships before covering columns |
| Team directory | team(workspace_id,status,id),team-membership composite PK | creation-order candidate(workspace_id,status,created_at,id); grouped member counts by bounded page |
| Project directory | project(workspace_id,team_id,status,id) | workspace-wide candidate(workspace_id,status,created_at,id); team variant only for measured workload |
| Project issue page | issue(workspace_id,project_id,status,created_at,id) | already matches initial order; state/priority variants only for common selective filters; enum order≠UX priority |
| My Work | issue(workspace_id,assignee_membership_id,status,id) | candidate(workspace_id,assignee_membership_id,status,created_at,id); partial ACTIVE option needs literal/generic plan proof |
| Forward/reverse adjacency | unique(workspace_id,upstream_issue_id,downstream_issue_id); reverse(workspace_id,downstream_issue_id) | reverse stable candidate(workspace_id,downstream_issue_id,upstream_issue_id,id); project edge lists require bounded seed join or measured read model |
| Issue key | project unique(workspace_id,key),issue unique(workspace_id,project_id,sequence) | scope and ancestor authorization; never global alias |
| SID retirement | family(user_id,revoked_at),family PK; **no digest index** | priority full B-tree(sid_digest,user_id,id); retireSid discovery has no revoked predicate and orders user_id,id. Partial WHERE revoked_at IS NULL cannot cover current revoked-row discovery. No digest uniqueness assumption or security query weakening |
| Title/description search | no search index | tenant-filtered GIN tsvector candidate; substring parity may need separately reviewed pg_trgm extension/index. FTS≠substring; analyzer/collation/rank cursor and description bounds pending |

Illustrative desired issue shape; **not permission-complete executable production SQL**:

```sql
SELECT i.id,i.project_id,i.sequence,i.title,i.state,i.priority,i.version,
       i.created_at,i.assignee_membership_id
FROM issues i
JOIN projects p ON (p.workspace_id,p.id)=(i.workspace_id,i.project_id)
JOIN teams t ON (t.workspace_id,t.id)=(p.workspace_id,p.team_id)
WHERE i.workspace_id=$1::uuid AND i.project_id=$2::uuid
  AND i.status='ACTIVE' AND p.status='ACTIVE' AND t.status='ACTIVE'
  AND EXISTS (SELECT 1 FROM team_memberships tm
              WHERE tm.workspace_id=$1::uuid AND tm.team_id=t.id
                AND tm.membership_id=$3::uuid)
  -- Mandatory approved issue-level visibility predicate still required.
  AND (i.created_at,i.id)>($4::timestamptz,$5::uuid)
ORDER BY i.created_at,i.id LIMIT $6; -- <=101 for lookahead
```

First page omits comparator. Every join carries tenant; EXISTS avoids membership fan-out. Fetch dependency/assignee summaries in bulk over≤100returned IDs, never per item. Counts use the same authorized filter relation; don't count a multiplied member/project/issue join. Page teams/projects first, then grouped summaries.

Current primitive post-filters≤100rows. A shorter result does not establish end-of-list. Future SQL visibility is preferred. If post-filter unavoidable, inspect≤500candidates in≤5chunks, cursor advances to last inspected tuple, empty visible page may still continue, no hidden count. Never unboundedly fetch to fill a page. Exact counts require the same safely expressible visibility. Policies remain pure and no remote I/O.

## Transactions, locks and measured plans

Preserve SERIALIZABLE,2s acquisition/5s callback,1.5s lock timeout/4s statement timeout. Hard ceilings are not SLOs or cancellation. Future bounded read method may choose stricter500ms SQL budget after proof; no timeout increase. No cache/network/email in transactions. Preserve user→family→workspace→resource order and entry/completion primary checks. Current workspace FOR UPDATE serializes writes; report hot-tenant throughput/lock waits honestly. No per-query Valkey access; revocation ordering cannot recall earlier responses.

Proposed business SELECT budgets: lists≤4,overview/My Work≤8,graph≤12. Count separately total SQL including auth entry/completion, membership/project, SET/transaction overhead; proposed total≤24normal/32graph requires measurement. No unlimited helpers hidden by exclusion. Complete-operation retries≤2 only on confirmed aborted idempotent operations with fresh authorization; unknown commits never automatically replay effects.

Future plan procedure: owned synthetic DB at each tier, ANALYZE, `EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, FORMAT JSON)`; record estimates/actual rows/loops/index/heap buffers/temp/sort spills/scan work. Compare literal/custom/generic prepared plans, common/rare filters, ties, empty/hidden scopes, hot/cold pages, skewed tenants, deep/hub graph, retained revoked-family history. EXPLAIN ANALYZE executes work: mutation probes only on owned fixtures with reviewed rollback/side-effect handling. Investigate large scans/sorts for tiny pages; seqscan on a small table is not intrinsically wrong. Candidate approval compares latency plus write/WAL/storage/vacuum/lock costs, not just index usage. Attach actual plans before claims.

No speculative migration/index install, partitioning, RLS/role change, lock narrowing or runtime instrumentation in this phase.

Index cost review includes full versus partial active-row candidates, write amplification on status/assignment changes and autovacuum/retention growth. Partial SID retirement is rejected for the current query; no index DDL is proposed as already evaluated.
