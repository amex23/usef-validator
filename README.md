# USEF Member Validation API

Serverless function to validate USEF membership IDs via the USEF API.

## Deployment

This project is deployed on Vercel and automatically deploys on push to the `main` branch.

## Endpoint

**POST** `/api/validate-usef`

### Request Body
```json
{
  "membershipId": "1234567",
  "lastName": "Smith"
}
```

### Response
```json
{
  "valid": true,
  "membershipId": "1234567"
}
```

or
```json
{
  "valid": false,
  "error": "Unable to verify membership..."
}
```

## Local Development

1. Install Vercel CLI: `npm install -g vercel`
2. Run locally: `vercel dev`
3. Test: `http://localhost:3000/api/validate-usef`

## Testing
```bash
curl -X POST http://localhost:3000/api/validate-usef \
  -H "Content-Type: application/json" \
  -d '{"membershipId":"1234567","lastName":"TestName"}'
```