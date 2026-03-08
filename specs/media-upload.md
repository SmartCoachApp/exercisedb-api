# Media Upload

One-time script to upload all 5,296 exercise GIF files to the private GCS bucket. Idempotent — safe to re-run.

## User Capabilities

- Operator can upload all images with a single command: `bun run scripts/upload-media.ts`
- Script skips files already present in the bucket (idempotent)
- Script shows upload progress and a summary on completion
- Operator can re-run the script to upload only newly added images

## Source & Destination

| | Path |
|---|---|
| **Source** | `/Users/smartcoach/Documents/exercises/exercises-db/images/{resolution}/` |
| **Destination** | `gs://smart-coach-exercises-media/images/{resolution}/` |
| **Resolutions** | 180, 360, 720, 1080 |
| **Files per resolution** | 1,324 GIFs |
| **Total files** | 5,296 |

## Behavior

1. Authenticates using `GCS_SERVICE_ACCOUNT_KEY` env var (same one used by the API)
2. For each resolution (180 → 360 → 720 → 1080):
   - Lists existing objects in `images/{resolution}/` to determine what's already uploaded
   - Iterates local GIFs; skips any already present in the bucket
   - Uploads new files with `Content-Type: image/gif` and `Cache-Control: public, max-age=86400`
3. Prints a progress line per file: `[360] 0001.gif ✓ uploaded` or `[360] 0001.gif — skipped`
4. Prints final summary: total uploaded, total skipped, any errors

## Constraints

- Script reads `GCS_SERVICE_ACCOUNT_KEY` and `GCS_BUCKET_NAME` from environment (or `.env` file)
- Requires `@google-cloud/storage` npm package
- Source path is hardcoded to local dev machine path — not part of CI/CD
- Not intended for production deployment pipeline; run once manually
- On error for a single file, logs the error and continues (does not abort)

## Related Specs

- [GCS Media](./gcs-media.md) — bucket configuration and access model

## Source

- `scripts/upload-media.ts`
