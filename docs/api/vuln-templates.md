# Vulnerability Templates API

Base URL: `https://<rest-id>.execute-api.us-east-1.amazonaws.com/dev`

Authentication: API Key via `x-api-key` header. Obtain the key from the API Gateway console (resource: `vuln-templates-key`).

## Endpoints

### List Templates
GET /vuln-templates

Response: `200` JSON array of templates.

### Get Template
GET /vuln-templates/{id}

Responses:
- `200` Template object
- `404` Not found

### Create Template
POST /vuln-templates
Body (JSON):
```
{
  "title": "Example Vuln",
  "severity": "HIGH",
  "description": "..."
}
```
Responses:
- `201` Created object
- `400` Validation error

### Update Template
PUT /vuln-templates/{id}
Body: Partial or full template fields.
Responses:
- `200` Updated object
- `400` Validation error
- `404` Not found

### Delete Template
DELETE /vuln-templates/{id}
Responses:
- `200` `{ "deleted": true }`
- `404` Not found

## Errors
Common error schema:
```
{ "error": "Code", "message": "Human readable details" }
```

## Rate Limiting
Currently governed by the default usage plan (no explicit throttling set). Add limits in the usage plan if needed.

## Example cURL
```
curl -H "x-api-key: $API_KEY" https://<rest-id>.execute-api.us-east-1.amazonaws.com/dev/vuln-templates
```

## OpenAPI
See `docs/api/openapi.yaml` for machine-readable specification.
