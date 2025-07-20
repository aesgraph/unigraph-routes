# CORS Configuration

This project now uses environment variables for CORS configuration instead of hardcoded origins.

## Environment Variables

### `ALLOWED_ORIGINS`

A comma-separated list of allowed origins for CORS requests.

**Example:**

```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

### `CORS_ALLOW_ALL`

Set to `'true'` to allow all origins (useful for development).

**Example:**

```
CORS_ALLOW_ALL=true
```

## Configuration Priority

1. If `CORS_ALLOW_ALL=true`, all origins are allowed (`Access-Control-Allow-Origin: *`)
2. If `ALLOWED_ORIGINS` is set, only those origins are allowed
3. If neither is set, all origins are allowed as a fallback (less secure)

## Migration from Hardcoded Origins

The following hardcoded origins have been removed from the API files:

- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://localhost:4173`
- `https://unigraph-routes-bahfci1ve-aesgraph.vercel.app`
- `https://aesgraph.vercel.app`

## Adding to Your .env File

Add these variables to your `.env` file:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:4173,https://unigraph-routes-bahfci1ve-aesgraph.vercel.app,https://aesgraph.vercel.app
CORS_ALLOW_ALL=false
```

## Security Benefits

- **Environment-specific**: Different origins for development, staging, and production
- **No code changes**: Update origins without redeploying code
- **Better security**: Restrict origins to only what's needed
- **Flexibility**: Easy to add/remove origins as needed
