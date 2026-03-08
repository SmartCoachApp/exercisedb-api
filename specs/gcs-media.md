# GCS Media

Private Google Cloud Storage bucket holding all exercise GIF animations in 4 resolutions. The API generates short-lived Signed URLs returned in every exercise response.

## User Capabilities

- Consumers receive pre-signed image URLs for all 4 resolutions in every exercise response
- The PWA can load images directly from GCS using the signed URLs without hitting the API again
- Signed URLs expire after 24 hours; fresh URLs are obtained by re-fetching the exercise endpoint
- Images are inaccessible without a valid signed URL (bucket is fully private)

## Bucket Configuration

| Property | Value |
|----------|-------|
| Bucket name | `smart-coach-exercises-media` |
| GCP Project | `smart-coach-project-app` |
| Location | `us-east4` (same region as Cloud Run services) |
| Storage class | Standard |
| Public access | **Disabled** (uniform bucket-level access, all public ACLs blocked) |

## Object Structure

```
images/
├── 180/
│   ├── 0001.gif
│   ├── 0002.gif
│   └── ...
├── 360/
│   └── ...
├── 720/
│   └── ...
└── 1080/
    └── ...
```

Path pattern: `images/{resolution}/{exerciseId}.gif`

Total objects: 5,296 (1,324 exercises × 4 resolutions)

## Signed URL Generation

- **Method**: V4 Signed URLs via GCS SDK
- **TTL**: 24 hours
- **Signer**: Service account key stored as `GCS_SERVICE_ACCOUNT_KEY` env var (base64-encoded JSON key)
- **Signing service account**: Dedicated SA with `roles/storage.objectViewer` on the bucket

URLs are generated at response time for all 4 resolutions of every exercise included in a response. For a paginated list of 10 exercises, 40 signed URLs are generated per request.

## Images Object in Response

```json
"images": {
  "180":  "https://storage.googleapis.com/smart-coach-exercises-media/images/180/0001.gif?X-Goog-Signature=...",
  "360":  "https://storage.googleapis.com/smart-coach-exercises-media/images/360/0001.gif?X-Goog-Signature=...",
  "720":  "https://storage.googleapis.com/smart-coach-exercises-media/images/720/0001.gif?X-Goog-Signature=...",
  "1080": "https://storage.googleapis.com/smart-coach-exercises-media/images/1080/0001.gif?X-Goog-Signature=..."
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GCS_BUCKET_NAME` | `smart-coach-exercises-media` |
| `GCS_SERVICE_ACCOUNT_KEY` | Base64-encoded GCP service account JSON key |

## GCP Setup Requirements

1. Create bucket `smart-coach-exercises-media` in `us-east4`
2. Enable uniform bucket-level access (disable legacy ACLs)
3. Block all public access
4. Create a service account (e.g. `exercisedb-media-reader@smart-coach-project-app.iam.gserviceaccount.com`)
5. Grant it `roles/storage.objectViewer` on the bucket
6. Create and download a JSON key for this service account
7. Base64-encode the key and set as `GCS_SERVICE_ACCOUNT_KEY` in Vercel

## Constraints

- Signed URL signing requires a real service account key (not Application Default Credentials) because Vercel runs outside GCP
- 40 signed URLs generated per page of 10 exercises — keep signing fast (in-memory, synchronous)
- Bucket name and region are fixed; changing requires re-uploading all 5,296 files
- No CDN layer in this spec — direct GCS signed URLs

## Related Specs

- [Exercises API](./exercises-api.md) — `images` field in every exercise response
- [Media Upload](./media-upload.md) — one-time script to populate the bucket

## Source

- `src/services/signed-url.service.ts`
- `src/data/types.ts`
