# Authentication

Static API key authentication protecting all ExerciseDB API endpoints. Only the smart-coach-pwa frontend is authorized to consume this API.

## User Capabilities

- The smart-coach-pwa can access all endpoints by including the `X-API-Key` header with the shared secret
- Requests without the header receive a `401 Unauthorized` response
- Requests with an invalid key receive a `401 Unauthorized` response

## Mechanism

All requests must include:

```
X-API-Key: <secret>
```

The secret is compared against the `API_KEY` environment variable. No session, no JWT, no OAuth.

## Configuration

| Environment Variable | Where Set | Description |
|---------------------|-----------|-------------|
| `API_KEY` | Vercel project env vars | The shared secret for this API |
| `NEXT_PUBLIC_EXERCISEDB_API_KEY` (or similar) | smart-coach-pwa env vars | Same secret, sent as header from PWA |

## CORS

The API restricts CORS to the smart-coach-pwa domain only:
- Allowed origin: `https://nextjs-pwa-service-1094597659488.us-east4.run.app` (and any custom domain)
- Allowed methods: `GET`, `OPTIONS`
- Allowed headers: `X-API-Key`, `Content-Type`

This provides defense-in-depth: even if the API key leaked, browsers would block cross-origin calls from unauthorized domains.

## Exemptions

- `GET /docs` — API documentation UI, no key required
- `GET /swagger` — OpenAPI spec, no key required
- `OPTIONS` preflight requests — no key required

## Constraints

- Key rotation requires updating env vars on both Vercel and the PWA and redeploying
- No per-consumer key differentiation — one key for the PWA
- No rate limiting in this spec (add separately if needed)

## Related Specs

- [Exercises API](./exercises-api.md) — protected endpoints
- [GCS Media](./gcs-media.md) — GCS access uses a separate service account, not this API key

## Source

- `src/middleware/auth.ts`
- `src/app.ts`
