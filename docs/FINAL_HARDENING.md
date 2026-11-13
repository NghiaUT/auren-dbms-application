# Final application hardening

Baseline: `6ca0766688a3b02a0513809e138fe4112ac0d227` (clean working tree).
Branch: `fix/final-app-hardening`. Local only; no push, merge or deployment.

## Acceptance and scope

Atomic stock reservation without stale-version rejection, no oversell, transactional
rollback, exactly-once claim/payment/delivery, serialized final schedules, unique
limited serials and controlled duplicate-review conflicts. Preserve restock version
checks, RBAC and ownership. Only application code/tests/CI/docs may change.
Reports, PDFs, LaTeX, slides and research benchmark data are outside this task.

## Discovery and decisions

Graphify is unavailable; source inspection is the evidence for relationships.
Routes/controllers validate input and roles; services manage transactions;
repositories issue prepared SQL using the supplied connection.

- `placeOrder` reads inventory version before a conditional update: stale version
  can reject available stock. Use one availability-conditional UPDATE, incrementing
  version as a change token. Version/retry adds unnecessary retries here. Restock
  keeps its explicit version predicate.
- `createReview` prechecks uniqueness before INSERT. The database UNIQUE key remains
  authoritative; map duplicate-key failure to `DUPLICATE_REVIEW`/409.
- Claim and pay already use atomic predicates; delivery/cancellation test the
  expected status before transactional side effects. Payment scheduling locks the
  order before reading payments. Preserve these implementations and add DB oracles.
- SQL logger treats version bumps as optimistic locks even without a version
  predicate; align its classification with the chosen reservation mechanism.

## Test organization

New deterministic fixtures and concurrency scenarios are in
`backend/src/scripts/test-concurrency.ts`. They require NODE_ENV=test and a DB_NAME
ending `_test`; every scenario owns and cleans its rows. A 120-second watchdog
identifies hangs. No throughput/timing assertions. `CONCURRENCY_SCENARIO` selects
one named scenario for diagnosis; CI runs all scenarios without this variable.

CI rejects a filtered scenario run and always executes all scenarios. No dependency
or schema migration was added. Existing serials are preserved; newly generated
Limited variants use `<variantId>-01/N` so the global serial UNIQUE key does not
reject independent variants with equal edition sizes.

## Confirmed defects and reproductions

| Evidence | Defect | Correction |
| --- | --- | --- |
| [RAN] baseline `stock-800`: success=100, failure=700, reserved=100, available=700 | `placeOrder` rejects available stock with VERSION_CONFLICT | Availability-conditional UPDATE; 0 rows means OUT_OF_STOCK |
| [RAN] forced concurrent eligibility SELECTs: loser throws ER_DUP_ENTRY | `createReview` leaks SQL error to middleware, which previously maps it to generic 409 DUPLICATE_ENTRY (not a proven HTTP 500) | Map to 409 DUPLICATE_REVIEW in service; HTTP race verifies contract |
| [RAN] `limited-multiple-lines`: only 1 serial for 2 lines | Same transaction selects the still-available serial twice before assignment | Mark reserved immediately after locking; verify assignment affectedRows |
| [RAN] `limited-variant-serials` fails before variant repository patch | Independent variants generate identical 01/N values under global UNIQUE(serial_no) | Namespace newly created serials by variant ID |
| [READ] POST response vs frontend OrderDetail; [RAN] POST/GET parity after patch | Missing customerName/customerEmail and payment dueDate in creation response | Include identity, assignment, location and due dates within transaction |
| [READ] analyzeQuery classified version bump without predicate as optimistic | Logger mislabels atomic reservation and exhaustion as optimistic conflict | Only classify check+bump as optimistic; core regression covers both forms |

## Concurrency audit

| Flow | Evidence / conclusion |
| --- | --- |
| Standard order | [RAN] 8 workers × 100 service calls, distinct committed orders/items/payments; 801st call is 409 OUT_OF_STOCK |
| Limited order | [RAN] 8 attempts / 4 units gives 4 winners, 4 EDITION_SOLD_OUT; all serial/item links distinct; 2 identical lines get distinct serials |
| Customer cancellation | [RAN] existing smoke double cancellation and new cancel-vs-claim; loser cannot release stock; [READ] expected-status predicate precedes side effects |
| Sales cancellation | [RAN] cancel-vs-in_production; only one winner; stock/payment/spending match final state |
| Sales claim | [RAN] one winner / one ALREADY_CLAIMED; sales_user_id matches winning user; [READ] atomic pending/unassigned predicate |
| Status/delivery | [RAN] one delivered transition; physical/reserved stock, limited sold flag and customer spending change once; [READ] state predicate precedes all effects in transaction |
| Payment | [RAN] one paid row and amount counted once, paid_at/method unchanged after rejected resubmit; [READ] pending/overdue predicate checks affectedRows |
| Payment scheduling | [RAN] one concurrent final accepted; final count=1, active SUM=order.total; [READ] order FOR UPDATE before reading payments |
| Restock | [RAN] stale token after reservation rejected, two restocks with same version give one winner; quantity/version increment once |
| Review | [RAN] real HTTP race after forcing both prechecks: statuses 201/409, loser DUPLICATE_REVIEW, exactly one DB row |
| Tier recalculation | [READ] correlated UPDATE derives tier from customer total_spent; it does not replace spending. Delivery increments spending atomically. [RAN] existing admin smoke preview/apply. Concurrent tier preview counts are not guaranteed to describe a later DB snapshot; no new tier/delivery interleaving test |

## Consistency / SQL / security audit

- [READ] `backend/src/routes` and controllers compared with all `frontend/src/api`
  clients. Catalog's price_asc/price_desc values are explicitly converted to
  sort=price/order=asc or desc. Payment scheduling exposes both legacy
  `/orders/:id/payments` and `/sales/orders/:id/payments`; the UI uses the latter.
- [READ] App.tsx maps public/customer/sales/admin pages with role guards. Four
  comment-only Admin skeleton files had no imports/callers and were removed;
  the actual A03/A04/A06/A07 implementations remain routed. Screen inventory
  matches those routes. No executable core TODO/FIXME/TBD/coming-soon was found;
  placeholder attributes are form hints.
- [READ] Mutation repository calls inside existing service withTransaction blocks
  use conn. The additional order-header read also uses conn. No mutation was
  moved outside its transaction. Payment remains a standalone atomic UPDATE.
- [READ] SQL mutation values stay bound parameters. Dynamic resource/order/sort
  fragments come from existing whitelists. Existing order-history aggregation
  preaggregates items and payments independently to avoid fan-out.
- [READ] FK/UNIQUE/CHECK constraints and production indexes remain intact.
  Limited allocation retains FOR UPDATE. No changes to RBAC, ownership, price
  sourcing or caller-selected customer identity.
- [RAN] Existing HTTP tests exercise server pricing, invalid quantities,
  authentication, role enforcement, other-sales denial and review ownership.
  Admin smoke still covers safe deletion, report aggregates and tier recalculation.
- [READ] README, FUNCTIONAL_REQUIREMENTS, ARCHITECTURE, API_CONTRACT,
  HAPPY_PATH_DEMO and WORK_BREAKDOWN now distinguish reservation from restock.
  Corrected stale FR11 pending/overdue predicate and review-delete 403 semantics.
  No report assets were read for rewriting or modified.

## Verification record

Verified on Windows, Node `v24.13.0`, MySQL Community `8.4.8` (InnoDB),
mysql2 `3.24.6`, tsx `4.23.15`, TypeScript `5.9.3` from the existing lockfile.
The final source revision is the commit containing
this record; subsequent comments/docs-only changes reuse the execution evidence.

Environment for DB checks (PowerShell):

```powershell
$env:NODE_ENV='test'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='56307'
$env:DB_USER='root'
$env:DB_PASS=''
$env:DB_NAME='auren_hardening_acceptance_test'
$env:JWT_SECRET='hardening-local-test-only'
$env:SQL_LOG='off'
$env:CI='true'
```

This root account belongs only to a new disposable loopback server, not the local
demo server. Local TCP checks needed host execution because sandbox TCP is denied.

| Command | Captured result |
| --- | --- |
| [RAN] npm --prefix backend run db:setup | exit 0, fresh schema and production indexes, seed completed |
| [RAN] npm --prefix backend run typecheck | exit 0 |
| [RAN] npm --prefix backend run build | exit 0 |
| [RAN] npm --prefix frontend run typecheck | exit 0 |
| [RAN] npm --prefix frontend run build | exit 0; JS 1,028.60 kB / gzip 268.13 kB warning remains |
| [RAN] npm --prefix backend run test:all | exit 0; test:smoke then test:concurrency; all 9 scenarios passed |
| [RAN] unsafe database guards | NODE_ENV=test/non-test schema and NODE_ENV=development/test schema both refused with exit 1 before DB access |
| [RAN] git diff --check | no whitespace errors |

The host test server on port 56307 was shut down with mysqladmin after verification.

Stock results: supply 800 / attempts 800 -> 800 success, 0 failure, reserved 800,
available 0; extra attempt rejected OUT_OF_STOCK. Supply 100 / attempts 800 ->
100 success, 700 OUT_OF_STOCK, reserved 100, available 0. No oversell in either
scenario. Rollback preserves inventory, serials and order/item/payment counts.

Execution logs (local, ignored): `backend/node_modules/.cache/final-hardening/`:
`baseline-stock-800.log`, `baseline-delivery-review.log`,
`baseline-limited-multiple-lines.log`, `baseline-variant-serials.log`,
`acceptance-setup.log`, `acceptance-tests.log`, `audit-patterns.log`,
`audit-transactions.log`.

## CI and environment limits

CI retains Node 20 / MySQL 8.0 setup/build/typecheck/smoke, and adds a mandatory
test:concurrency step. No optional failure handling or performance threshold.
[UNKNOWN] This changed workflow has not run on GitHub: this task prohibits push.
Local equivalent passes on the versions above, not on Node 20/MySQL 8.0.

[BLOCKED] Fresh Docker Compose startup: Docker Desktop fails before its engine
is available, with `initializing Inference manager ... dockerInference ... The
file cannot be accessed by the system`. No existing volume was deleted and Docker
settings were not reset. After Docker is repaired, use a new disposable project:

```powershell
$env:DB_PORT='56308'; $env:API_PORT='56400'; $env:WEB_PORT='56173'
$env:DB_NAME='auren_compose_hardening_test'
docker compose -p auren-hardening-check up -d
docker compose -p auren-hardening-check ps -a
docker compose -p auren-hardening-check logs mysql seeder api web
docker compose -p auren-hardening-check exec -T -e NODE_ENV=test -e DB_NAME=auren_compose_acceptance_test -e SQL_LOG=off api sh -c 'npm run db:setup && npm run test:all'
```

Expected: MySQL healthy, seeder exit 0, API/web healthy; no bootstrap/index error.
Stop only that disposable project afterwards. No claim of production reliability,
exhaustive schedule exploration or performance is made from these tests.
