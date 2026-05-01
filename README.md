# Restaurant locations API (Bonial technical challenge)

This repository implements a **Node.js + TypeScript + Fastify** HTTP API that answers: *which restaurants are “visible” from a given point on the plane*, where each restaurant covers a **disk** (center + **radius**). It also serves **detail** views, supports **upserts** (`PUT`), ships an **OpenAPI** document with **Swagger UI**, and includes a **spatial index** so search stays efficient when the catalog grows.

This README is intentionally long: it shows **exactly** how to run, test, and interpret responses and errors up front, then explains **why** the stack and algorithms were chosen, **how** control flows through the codebase (a dry run), **what** each tool does, and how **large datasets** are handled today and how you could scale further.

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Quick start](#quick-start)
3. [HTTP endpoints (summary table)](#http-endpoints-summary-table)
4. [npm scripts](#npm-scripts)
5. [How to run the server](#how-to-run-the-server)
6. [How to exercise endpoints (curl + expected outcomes)](#how-to-exercise-endpoints-curl--expected-outcomes)
7. [Tech stack and rationale](#tech-stack-and-rationale)
8. [Key business rules](#key-business-rules)
9. [Tools used in this repo (what each one does)](#tools-used-in-this-repo-what-each-one-does)
10. [Request lifecycle: code flow dry run](#request-lifecycle-code-flow-dry-run)
11. [Large datasets, performance, and scalability](#large-datasets-performance-and-scalability)
12. [Configuration: environment variables and constants](#configuration-environment-variables-and-constants)
13. [OpenAPI and Swagger UI](#openapi-and-swagger-ui)
14. [Automated tests](#automated-tests)
15. [Source layout (where to look)](#source-layout-where-to-look)
16. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** **≥ 20** (see `package.json` → `engines`). Older Node versions are not supported.
- **npm** (ships with Node) to install dependencies and run scripts.

No Docker, database, or external services are required for the default run: data lives in a **JSON file** on disk and is loaded into **memory** at startup.

---

## Quick start

```bash
cd /path/to/bonial-restaurants-locations-api
npm install
npm run dev
```

Then:

- Health: `curl -s http://127.0.0.1:3000/health`
- Search: `curl -s "http://127.0.0.1:3000/locations/search?x=2&y=2"`
- Swagger UI: open `http://127.0.0.1:3000/documentation` in a browser.

To use the **10,000-row** sample file:

```bash
LOCATIONS_FILE=locations_big.json npm run dev
```

---

## HTTP endpoints (summary table)

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | **`/health`** | Liveness: `{ "status": "ok" }`. |
| **GET** | **`/locations/search?x=<int>&y=<int>`** | Restaurants whose disk covers `(x,y)`, sorted by distance. |
| **GET** | **`/locations/:id`** | Detail card for one restaurant. |
| **PUT** | **`/locations/:id`** | Upsert restaurant (JSON body; path id must match body id). |
| **GET** | **`/documentation`** | Swagger UI (HTML). |
| **GET** | **`/documentation/json`** | OpenAPI 3 specification JSON. |

---

## npm scripts

| Script | Command | When to use it |
|--------|---------|----------------|
| **`npm run dev`** | `tsx watch src/index.ts` | Local development with auto-reload on save. |
| **`npm run build`** | `tsc -p tsconfig.build.json` | Produce `dist/` for production or `npm start`. |
| **`npm start`** | `node dist/index.js` | Run compiled server (**run `build` first**). |
| **`npm test`** | `vitest run` | CI / one-shot test run. |
| **`npm run test:watch`** | `vitest` | Interactive test watch while developing. |

---

## How to run the server

### Development (TypeScript, hot reload)

```bash
npm install
npm run dev
```

Default URL: **`http://127.0.0.1:3000`** (unless `PORT` is set).

### Development with the large sample file

From the repo root:

```bash
LOCATIONS_FILE=locations_big.json npm run dev
```

### Production-style (compile then run)

```bash
npm install
npm run build
npm start
```

Again, override port or file with environment variables:

```bash
PORT=8080 LOCATIONS_FILE=/absolute/path/to/locations_big.json npm start
```

### Startup failure (catalog file)

If **`LOCATIONS_FILE`** points to a missing path, unreadable file, invalid JSON, or invalid row shape, **`createApplicationAsync`** throws during bootstrap and the process exits (see `src/index.ts` catch → `process.exit(1)`).

---

## How to exercise endpoints (curl + expected outcomes)

Replace **`BASE`** with your server URL, e.g. `http://127.0.0.1:3000`.

### `GET /health`

```bash
curl -sS "$BASE/health"
```

**Expected (200):**

```json
{ "status": "ok" }
```

---

### `GET /locations/search`

**Query rules (validation):**

- **`x`** and **`y`** are **required**.
- Each must be a **string of digits only** (`^[0-9]+$`) — no sign, no decimal point.
- Semantically they must parse to **non-negative integers**; negative values are rejected by schema before domain logic.

**Example (200) using default `locations.json`:**

```bash
curl -sS "$BASE/locations/search?x=2&y=2"
```

You should see JSON shaped like:

```json
{
  "user-location": "x=2,y=2",
  "locations": [
    {
      "id": "19e1545c-8b65-4d83-82f9-7fcad4a23114",
      "name": "Mantra Restaurant",
      "coordinates": "x=2,y=2",
      "distance": 0
    },
    {
      "id": "19e1545c-8b65-4d83-82f9-7fcad4a23115",
      "name": "Goji",
      "coordinates": "x=3,y=3",
      "distance": 1.41421
    }
  ]
}
```

Exact list depends on radii and geometry; **ordering** is always by **ascending `distance`**.

**Example (400) — missing `y`:**

```bash
curl -sS "$BASE/locations/search?x=1"
```

**Example (400) — negative sign fails pattern:**

```bash
curl -sS "$BASE/locations/search?x=-1&y=2"
```

**Example (400) — non-digit:**

```bash
curl -sS "$BASE/locations/search?x=1a&y=2"
```

---

### `GET /locations/:id`

**Example (200) — real id from `locations.json`:**

```bash
curl -sS "$BASE/locations/19e1545c-8b65-4d83-82f9-7fcad4a23114"
```

**Expected (200) shape:**

```json
{
  "name": "Mantra Restaurant",
  "type": "Restaurant",
  "id": "19e1545c-8b65-4d83-82f9-7fcad4a23114",
  "opening-hours": "10:00AM-10:00PM",
  "image": "https://tinyurl.com",
  "coordinates": "x=2,y=2"
}
```

**Example (404):**

```bash
curl -sS "$BASE/locations/00000000-0000-0000-0000-000000000000"
```

Expected body:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Location not found"
  }
}
```

---

### `PUT /locations/:id`

**Rules:**

- `Content-Type: application/json`
- Body must match the schema (all required fields, `radius` integer **≥ 1**).
- **`body.id` must equal the path id`.**

**Example (200) — upsert new id:**

```bash
curl -sS -X PUT "$BASE/locations/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "name": "Demo",
    "type": "Restaurant",
    "opening-hours": "9:00AM-9:00PM",
    "image": "https://tinyurl.com",
    "coordinates": "x=1,y=1",
    "radius": 5
  }'
```

Then fetch it:

```bash
curl -sS "$BASE/locations/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
```

**Example (400) — path/body id mismatch:**

```bash
curl -sS -X PUT "$BASE/locations/path-id" \
  -H 'Content-Type: application/json' \
  -d '{"id":"other-id","name":"X","type":"Restaurant","opening-hours":"9-5","image":"https://tinyurl.com","coordinates":"x=0,y=0","radius":1}'
```

**Example (400) — invalid JSON syntax:**

```bash
curl -sS -X PUT "$BASE/locations/x" -H 'Content-Type: application/json' -d '{'
```

**Example (400) — invalid coordinates string (passes JSON schema but fails domain parse):**

Use `"coordinates": "not-valid"` with otherwise valid fields.

---

### Error codes reference

| HTTP | `error.code` | Typical cause |
|------|----------------|---------------|
| **400** | **`VALIDATION_ERROR`** | Fastify/Ajv rejected query, params, or body vs route schema. |
| **400** | **`INVALID_JSON`** | JSON body could not be parsed while `Content-Type: application/json`. |
| **400** | **`INVALID_USER_LOCATION`** | User coordinates failed domain rules (non-integer / negative). |
| **400** | **`BAD_REQUEST`** | Business rule violations (e.g. path id ≠ body id, malformed payload after JSON parse). |
| **404** | **`NOT_FOUND`** | Unknown `GET /locations/:id`. |
| **500** | **`INTERNAL_ERROR`** | Unexpected exception (logged server-side). |

---

## Tech stack and rationale

| Technology | Role here | Why it was chosen |
|------------|-----------|-------------------|
| **Node.js** | JavaScript runtime for I/O-bound HTTP servers. | Fastify and the ecosystem are native to Node; good fit for JSON APIs and async file loading. |
| **TypeScript** | Static typing over JavaScript. | Catches shape errors early (DTOs, query params, repository contracts), improves refactor safety for a challenge reviewers will read. |
| **Fastify** | Web framework (routing, plugins, validation, logging). | Required by the brief; known for **schema-driven validation**, good performance defaults, and a clean plugin model for OpenAPI (`@fastify/swagger`). |
| **JSON Schema (via Fastify)** | Validates query/params/body before handlers run. | Same schemas feed **runtime validation** and **OpenAPI** documentation—one definition, two consumers. |
| **@fastify/swagger + @fastify/swagger-ui** | Emits **OpenAPI 3** JSON and serves **interactive docs**. | Satisfies the “OpenAPI schema” acceptance criterion and makes manual testing easy for reviewers. |
| **Vitest** | Unit and integration test runner. | Fast, ESM-native, minimal config; `inject()` tests HTTP without opening real TCP ports for every assertion. |
| **tsx** | Executes TypeScript in dev without a separate compile step. | Faster iteration for `npm run dev`; production still uses `tsc` + `node` for a clear deploy path. |
| **tsc (TypeScript compiler)** | Emits JavaScript to `dist/` for `npm start`. | Standard production build; separates “dev comfort” from “deploy artifact”. |

**Why not Express / Nest / etc.?** The task explicitly asked for **Fastify**. Nest would add ceremony (modules, DI decorators) beyond what this API surface needs; Express would require more manual structure for validation + OpenAPI parity.

**Why in-memory JSON instead of a database?** The brief allows **your choice of datasource** and supplies a **JSON file**. An in-memory store keeps the solution **easy to run and review**, while still demonstrating how you would **swap persistence** later (see [scalability](#large-datasets-performance-and-scalability)).

---

## Key business rules

### Visibility (“search”)

- The plane’s **first quadrant** is assumed: restaurant centers `(xr, yr)` and user `(xu, yu)` are **non-negative integers**.
- Each restaurant has an integer **radius** `r > 0`.
- A restaurant is **visible** from the user iff **Euclidean distance** from user to restaurant center is **≤ `r`**:

  \[
  \sqrt{(xu - xr)^2 + (yu - yr)^2} \le r
  \]

- Implementation detail: the code compares **squared** values (`dist² ≤ r²`) to avoid redundant `sqrt` until a hit is confirmed, then uses `sqrt` for the reported **distance** and sorting.

### Sorting

- The search response lists visible restaurants sorted by **ascending distance**. Ties are broken deterministically by **`id`** (string compare) so two strategies (naive scan vs grid index) can be byte-compared in tests.

### Detail (`GET /locations/:id`)

- Returns the richer “card” fields (`opening-hours`, `image`, etc.) for one `id`.

### Upsert (`PUT /locations/:id`)

- **Path `id` must equal** `body.id` (prevents accidental cross-writes).
- After a successful upsert, the **in-memory map** and the **spatial grid** are kept consistent by **rebuilding** the grid from the full map (simple and correct when `maxRadius` can change).

### HTTP errors

- Most failures return:

  ```json
  { "error": { "code": "SOME_CODE", "message": "Human readable text" } }
  ```

- See [Error codes reference](#error-codes-reference).

---

## Tools used in this repo (what each one does)

| Tool / library | What it does in this project |
|----------------|------------------------------|
| **npm** | Installs dependencies from `package.json`, runs scripts (`dev`, `build`, `test`, …). |
| **node** | Executes the compiled server (`npm start` → `node dist/index.js`). |
| **tsc** | Type-checks and transpiles `src/**/*.ts` → `dist/**/*.js` (tests excluded via `tsconfig.build.json`). |
| **tsx** | Runs TypeScript directly during `npm run dev` (watch mode re-runs on file changes). |
| **fastify** | HTTP server: routing, lifecycle hooks, `reply.send`, logging, error handling integration. |
| **@fastify/swagger** | Collects route `schema` metadata and exposes machine-readable **OpenAPI 3** JSON. |
| **@fastify/swagger-ui** | Serves the **Swagger UI** static app so humans can try endpoints in a browser. |
| **vitest** | Runs automated tests; provides `describe` / `it` / `expect` and ESM-aware module loading. |
| **@types/node** | Type definitions for Node built-ins (`fs`, `path`, `process`, …). |

---

## Request lifecycle: code flow dry run

This section walks a single HTTP request through the **actual files** (a “dry run”). Adjust line references if the code moves; the **order** is stable.

### 1) Process entry

- **`src/index.ts`**  
  - Starts an async IIFE, calls **`createApplicationAsync()`** from `src/bootstrap/application-factory.ts`, then **`application.start()`**.

### 2) Application factory (boot)

- **`src/bootstrap/application-factory.ts` → `createApplicationAsync`**
  1. Builds **`EnvConfig`** via `EnvConfig.fromProcessEnv` (`src/config/env.config.ts`) → resolves **`PORT`** and **`LOCATIONS_FILE`** (see [configuration](#configuration-environment-variables-and-constants)).
  2. Constructs **`FastifyServerFactory`** (`src/http/fastify-server.factory.ts`) with logger options.
  3. **`createLocationDatasetLoader()`** (`src/persistence/location-dataset-loader.factory.ts`) wires:
     - `LocationFileReader` (`src/persistence/location-file.reader.ts`) — reads UTF-8.
     - `RawLocationRecordParser` (`src/locations/raw-location-record.parser.ts`) + `CoordinatesParser` (`src/locations/coordinates.parser.ts`).
  4. **`LocationDatasetLoader.load(path)`** (`src/persistence/location-dataset.loader.ts`):
     - Reads file text, `JSON.parse`, `assertRawLocationFileRoot` (`src/locations/location-json.guard.ts`), maps each row to **`ParsedLocation`**, builds **`LocationDataset`** (`src/locations/location-dataset.ts`) including **`maxRadius`**.
  5. Wraps rows in **`MutableGridBackedLocationRepository`** (`src/locations/repository/mutable-grid-backed-location.repository.ts`) — holds `Map<id, ParsedLocation>` + a **`GridLocationRepository`** snapshot.
  6. Builds route registrars:
     - `HealthRouteRegistrar` + `HealthController` (`src/routes/health/*`)
     - `LocationsRouteRegistrar` (`src/routes/locations/locations.route-registrar.ts`) with HTTP handlers + mapper.
  7. Returns **`new Application(env, factory, registrars)`** (`src/bootstrap/application.ts`).

### 3) Listening

- **`Application.start()`**
  1. `await buildServer()`:
     - `factory.create()` → bare Fastify instance.
     - `await registerOpenApi(app)` (`src/http/register-openapi.ts`) — Swagger + OpenAPI.
     - `registerHttpErrorHandler(app)` (`src/http/register-http-error-handler.ts`) — global `setErrorHandler`.
     - For each **`RouteRegistrar`** (`src/contracts/route-registrar.ts`): `registrar.register(app)` mounts routes + `schema`s.
  2. `app.listen({ port, host })` — host comes from **`HTTP_LISTEN_HOST`** in `src/config/app.constants.ts` (`0.0.0.0`).

### 4) Example: `GET /locations/search?x=3&y=2`

1. **Fastify** matches **`/locations/search`** before parametric `/locations/:id` (registration order matters).
2. **Ajv** validates **querystring** against `locationSearchQuerySchema` (`src/routes/locations/locations.schemas.ts`).
3. Handler: **`LocationSearchHttpHandler.handle`** (`src/routes/locations/location-search.http-handler.ts`):
   - Parses `x`/`y` defensively, calls **`catalog.searchVisible(x, y)`**.
4. **`MutableGridBackedLocationRepository.searchVisible`** delegates to inner **`GridLocationRepository.searchVisible`** (`src/locations/repository/grid-location.repository.ts`):
   - **`UserSearchCoordinatesValidator`** (`src/locations/repository/user-search-coordinates.validator.ts`) enforces integer + non-negative.
   - Computes **candidate cell range** around the user using **`maxRadius`** as cell size, collects ids from grid buckets, then **`appendHitIfVisible`** (`src/locations/repository/location-search-hits.util.ts`) applies exact `dist² ≤ r²`, **`sortHitsByDistance`** sorts.
5. **`LocationHttpMapper.toSearchResponse`** (`src/routes/locations/location-http.mapper.ts`) shapes JSON (`user-location` hyphen key, rounded distances).
6. **`reply.send`** returns **200** + JSON body.

### 5) Example: failure path (`PUT` with invalid JSON)

1. Fastify’s **content-type parser** rejects malformed JSON → error code **`FST_ERR_CTP_INVALID_JSON_BODY`**.
2. **`registerHttpErrorHandler`** maps that to **400** + `{ "error": { "code": "INVALID_JSON", ... } }`.

---

## Large datasets, performance, and scalability

### What “large” means in the brief

- Many restaurants (**thousands+**).
- Coordinates can be **large integers** (up to millions in the problem statement).
- Radii stay **bounded** so each search does not return enormous result sets.

The bundled **`locations_big.json`** has **10,000** points with coordinates up to **~10⁴** and radii **1–99**, which stress-tests the indexing assumption.

### What is implemented today

1. **Load once at startup**  
   The JSON file is read with `fs/promises`, parsed, validated, and converted into **`ParsedLocation`** objects once. Requests do **not** re-read the file.

2. **Uniform grid spatial index** (`GridLocationRepository`)  
   - Let **`R_max`** be the maximum radius in the current dataset (`LocationDataset.maxRadius`).
   - Each restaurant center is hashed into a **single cell** `(⌊x / R_max⌋, ⌊y / R_max⌋)`.
   - For a user query, only cells overlapping the **L∞ square** of half-edge `R_max` around the user are scanned; each candidate is **exact-checked** with `dist² ≤ r²`.
   - **Why this works:** any restaurant that could include the user must have center within distance **`≤ r ≤ R_max`**, hence within **`R_max`** in Euclidean distance, hence inside that bounding square.

3. **Correctness cross-check**  
   **`NaiveLocationRepository`** (full scan) remains in the codebase; **`grid-naive-parity.integration.test.ts`** compares grid vs naive on many random queries over **`locations_big.json`**.

4. **PUT / upsert**  
   After each write, the grid is **rebuilt** from the authoritative `Map` (`O(n)` per PUT). For rare admin writes this is acceptable; it avoids subtle bugs when `R_max` changes.

### Present limits

- **Memory:** the full catalog must fit in RAM (parsed objects + index structures).
- **Cold start:** loading and indexing **O(n)** happens before the server accepts traffic.
- **Single process:** no built-in horizontal scaling; multiple replicas would each hold their **own** copy unless you externalize state.

### Future scalability (concrete directions)

| Direction | What would change | Benefit |
|-----------|-------------------|---------|
| **SQLite / Postgres** | Replace / augment JSON load with a DB; store `x, y, radius` as columns; optionally **R\*Tree** or **PostGIS**. | Larger-than-RAM data, simpler replication snapshots, optional SQL tooling. |
| **Streaming JSON parse** | Stream-parse the locations array when files exceed memory. | Lower peak memory during boot. |
| **Incremental grid updates** | On `PUT`, update only affected cells instead of full rebuild. | Faster writes at the cost of more complex invariants. |
| **Horizontal scaling** | Stateless app + shared DB + sticky-less reads; or read replicas. | Throughput under concurrent users. |
| **Caching** | Short-TTL cache keyed by `(x, y)` for search; invalidate on `PUT`. | Hot-spot read traffic reduction. |
| **Rate limiting / WAF** | `@fastify/rate-limit` or edge proxy. | Abuse protection under load. |

---

## Configuration: environment variables and constants

### Environment variables (read at runtime)

| Variable | Required? | Default | Meaning |
|----------|-----------|---------|---------|
| **`PORT`** | No | **`3000`** | TCP port for HTTP. Must be an integer **1–65535**. |
| **`LOCATIONS_FILE`** | No | **`locations.json`** (resolved vs **current working directory**) | Path to the JSON catalog. May be **absolute** or **relative**. |

Implementation: **`src/config/env.config.ts`**.  
Env **key names** and non-secret defaults are also centralized in **`src/config/app.constants.ts`** (`ENV_PORT`, `ENV_LOCATIONS_FILE`, `DEFAULT_HTTP_PORT`, …).

### Constants (not environment)

Also in **`src/config/app.constants.ts`**:

- **`HTTP_LISTEN_HOST`** — `0.0.0.0` (all interfaces).
- **`SWAGGER_UI_ROUTE_PREFIX`** — `/documentation` (Swagger UI); OpenAPI JSON at **`/documentation/json`**.

---

## OpenAPI and Swagger UI

After the server is running:

- **Swagger UI:** `http://127.0.0.1:3000/documentation` (or your host/port).
- **OpenAPI JSON:** `http://127.0.0.1:3000/documentation/json`

You can import the JSON into Postman/Insomnia or use Swagger’s **“Try it out”** UI.

---

## Automated tests

```bash
npm test
```

What is covered (high level):

- Coordinate parsing, dataset loading (happy + corrupt files), **grid vs naive parity** on `locations_big.json`.
- HTTP routes (`inject`) including validation, **404**, **PUT** upsert, invalid JSON, etc.
- OpenAPI routes return **200** and include documented paths.

Watch mode:

```bash
npm run test:watch
```

---

## Source layout (where to look)

```
src/
  index.ts                      # process entry
  bootstrap/
    application.ts              # Fastify wiring + listen
    application-factory.ts      # createApplication / createApplicationAsync
  config/
    app.constants.ts            # defaults + env key names + listen host + swagger prefix
    env.config.ts               # PORT + LOCATIONS_FILE parsing
  contracts/
    route-registrar.ts          # interface for route modules
  http/
    fastify-server.factory.ts
    http-error.ts
    register-http-error-handler.ts
    register-openapi.ts
  locations/                    # domain + geometry + repositories
  persistence/                  # file read + dataset loader + factory
  routes/
    health/
    locations/                  # HTTP handlers, schemas, openapi response fragments
```

---

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `EADDRINUSE` on start | Port already taken. | Set **`PORT`** to a free port. |
| Boot error about locations file | Bad **`LOCATIONS_FILE`**, permissions, or malformed JSON. | Verify path from **cwd** (`pwd`), open file in a JSON linter, check error message prefix from loader/factory. |
| Empty search results | No restaurant’s radius reaches the point. | Try a point near a known center from `locations.json`, or temporarily increase radii via `PUT`. |
| `npm start` fails / old code runs | Forgot to rebuild. | Run **`npm run build`** after edits when using `npm start`. |

---

## License / challenge context

This repository was built as a **technical challenge** implementation (Bonial-style restaurant visibility API). Add your own license if you open-source it beyond the challenge.
