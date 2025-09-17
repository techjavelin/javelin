# User API Keys

Base URL: `https://<rest-id>.execute-api.us-east-1.amazonaws.com/dev`

Authentication: Cognito ID token (Bearer JWT). These endpoints let an authenticated user manage **their own** API keys. Keys are attached to a shared usage plan (`UserApiKeysUsagePlan`). The secret key value is only returned at creation time — store it securely.

## Endpoints

### List Keys
GET /user-api-keys

Responses:
- `200` `[{ id, name, createdDate }]`
- `401` Unauthorized

### Create Key
POST /user-api-keys
Optional body:
```
{ "name": "my-automation" }
```
If omitted a name is generated (`user-<sub>-<timestamp>`).

Responses:
- `201` `{ id, name, createdDate, value }` (value only here)
- `401` Unauthorized

### Delete Key
DELETE /user-api-keys/{id}

Responses:
- `200` `{ "deleted": true }`
- `404` Not found (or not owned by user)
- `401` Unauthorized

## Error Format
```
{ "error": "Code", "message": "Details" }
```

## Notes
- Listing never returns `value`.
- Each key is tagged internally with `owner-sub` for ownership checks.
- Throttling / quotas can be applied via the API Gateway usage plan.

## Example cURL
```
curl -H "Authorization: $ID_TOKEN" \
  https://<rest-id>.execute-api.us-east-1.amazonaws.com/dev/user-api-keys
```

## OpenAPI
See `docs/api/openapi.yaml` (paths: `/user-api-keys`, `/user-api-keys/{id}`).
