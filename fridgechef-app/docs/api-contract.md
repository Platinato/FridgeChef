# FridgeChef API contract - v1 (draft)

The app talks to one backend through this contract. `MockApi` serves it today from an on-device SQLite mock database (`fridgechef-mock.db`, seeded from typed TypeScript seed modules). When the real endpoint arrives, `HttpApi` calls it. If the real backend differs, adapt `contract.ts` / `mappers.ts` / `endpoints.ts` only (see `architecture.md`).

All bodies are JSON. Auth is `<EXPO_PUBLIC_API_AUTH_HEADER>: <EXPO_PUBLIC_API_AUTH_SCHEME> <EXPO_PUBLIC_API_KEY>` (an empty scheme sends the raw key; an empty key sends no auth header). Also send `X-Client: fridgechef-ios/<appVersion>`. Unknown extra response fields are ignored.

## Error shape (any non-2xx)

```json
{ "error": { "code": "rate_limited", "message": "Too many requests", "retryAfterSec": 20 } }
```

| HTTP | App `ApiError.kind` | Retried automatically? |
|---|---|---|
| network failure / timeout | `network` / `timeout` | yes, 2× with backoff (500 ms, then 1 s; the detect call is retried once) |
| 401 / 403 | `unauthorized` | no |
| 404 | `not_found` | no |
| 429 | `rate_limited` | yes, after `retryAfterSec` or the `Retry-After` header (max 1 retry; not retried if the wait is over 30 s) |
| 5xx | `server` | yes, 2× with backoff |
| any other 4xx | `server` | no |
| 2xx that fails Zod (or isn't JSON) | `invalid_response` | no |

A request the caller aborts (screen left, query cancelled) is not retried.

---

## `GET /v1/catalog`

Static lists the backend controls. The app caches this for 24 h.

```json
{
  "moods": [{ "id": "comfort", "label": "Comfort", "icon": "bowl" }],
  "cuisines": ["Any", "Indian", "Italian"],
  "diets": [{ "id": "none", "label": "None" }],
  "allergies": ["Nuts", "Dairy"],
  "equipment": [{ "id": "stove", "label": "Stove" }],
  "addableItems": [{ "id": "cream", "name": "Fresh cream", "unit": "ml", "min": 0, "max": 500, "step": 25, "defaultValue": 200 }],
  "stapleSuggestions": [{ "name": "Cardamom", "category": "Spices" }],
  "defaultStaples": [{ "id": "turmeric", "name": "Turmeric", "category": "Spices", "unitHint": "~100 g jar", "unit": "tsp", "perLevel": 4 }]
}
```

## `POST /v1/scans/detect`

Detects ingredients and estimates quantities from 1-6 photos. The client resizes each photo to at most 1280 px on the long edge, JPEG quality ~0.7.

Request:

```json
{
  "images": [{ "id": "ph1", "mimeType": "image/jpeg", "data": "<base64, no data: prefix>" }],
  "knownStapleIds": ["turmeric", "salt"],
  "locale": "en-IN",
  "units": "metric"
}
```

Response:

```json
{
  "scanId": "scn_123",
  "items": [
    {
      "id": "chicken",
      "name": "Chicken breast",
      "category": "Protein",
      "unit": "g",
      "min": 100, "max": 1500, "step": 50,
      "estimate": 500,
      "confidence": "low",
      "photoIndex": 0,
      "altUnit": { "unit": "pcs", "factor": 200, "step": 1 },
      "imageUrl": "https://…/thumb.jpg"
    }
  ],
  "photoWarnings": [{ "photoIndex": 1, "type": "blurry", "message": "Photo 2 looks blurry" }]
}
```

- `confidence` is `high` | `med` | `low`. `low` items must be confirmed by the user before suggestions are requested.
- `altUnit.factor` is how many `unit` are in one `altUnit` (for example 240 ml per cup).
- `altUnit` and `imageUrl` are optional. `photoWarnings` may be omitted (treated as `[]`).
- `photoWarnings[].type` is `blurry` | `dark` | `no_food`.

## `POST /v1/recipes/suggest`

Request:

```json
{
  "ingredients": [{ "id": "chicken", "name": "Chicken breast", "quantity": 1000, "unit": "g" }],
  "staples": [{ "id": "turmeric", "name": "Turmeric", "level": 1 }],
  "preferences": {
    "mood": "comfort", "timeMin": 45, "effort": "moderate", "servings": 2, "hunger": "meal",
    "cuisines": ["Any"], "diet": "none", "allergies": [], "equipment": ["stove", "microwave"], "spice": 3
  },
  "limit": 12
}
```

Response: `{ "recipes": Recipe[] }`. The server decides which recipes fit the preferences. The **client** computes match %, have / missing, filter chips and sort order from these recipes plus the confirmed quantities (see `domain/`).

## `GET /v1/recipes/{id}`

Response: `Recipe`. Used to refresh saved or cooked recipes. The app also stores full snapshots so saved recipes work offline.

## `Recipe`

```json
{
  "id": "butter-chicken",
  "name": "Butter Chicken Lite",
  "subtitle": "Creamy tomato gravy, easy on the butter",
  "cuisine": "Indian",
  "diet": "nonveg",
  "timeMin": 35, "effort": 3, "spice": 3, "servings": 2,
  "nutrition": { "kcal": 540, "protein": 38, "carbs": 22, "fat": 30 },
  "moods": ["comfort", "date"],
  "equipment": ["stove"],
  "onePan": false,
  "imageUrl": "https://…",
  "ingredients": [{ "id": "chicken", "name": "Chicken breast", "qty": 400, "unit": "g" }],
  "steps": [{ "text": "Toss the chicken with yogurt…", "minutes": 10 }],
  "swaps": [{ "missing": "Fresh cream", "use": "Whisk 2 tbsp yogurt with 1 tsp butter." }]
}
```

- `diet` is `nonveg` | `egg` | `veg` | `vegan`.
- `effort` and `spice` are 1-5.
- `ingredients[].id` matches detected item ids and staple ids wherever possible. Unknown ids count as missing.
- `imageUrl` is optional; `swaps` may be omitted (treated as `[]`). Everything else is required.

## Mock behaviour (`MockApi`)

`MockApi` reads its data from the mock SQLite database (`fridgechef-mock.db`), which is opened only in mock mode. Each row stores one wire DTO exactly as defined above. The rows are seeded on first open from `services/api/mock/db/seed/*.ts`, which are typed as these DTOs. Every response goes through the same Zod schemas and mappers as `HttpApi`.

| Call | Mock behaviour |
|---|---|
| `catalog` | Returns the single catalog row. |
| `detect` | Returns mock detection rows whose `photoIndex` < number of photos. The second photo gets a `blurry` warning when 3+ photos are sent. |
| `suggest` | Filters the mock recipe rows by preferences (time, effort, equipment, diet, cuisines, allergies) using the ported domain logic. |
| `recipe` | Returns the recipe by id, or 404 `not_found`. |
| all calls | Latency comes from `EXPO_PUBLIC_MOCK_LATENCY_MS`. `EXPO_PUBLIC_MOCK_FAILURE_RATE` injects `server` errors. |
