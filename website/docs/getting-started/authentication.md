---
sidebar_position: 4
---

# Authentication

Airtruct supports authentication to protect the web UI and REST API. By default, authentication is disabled. You can enable **Basic Auth** for simple setups or **OAuth2/OIDC** for integration with identity providers like Keycloak, Okta, Auth0, or any OAuth2-compliant provider.

## Authentication Modes

Set the `AUTH_TYPE` environment variable to choose a mode:

| Value | Description |
|-------|-------------|
| `none` | No authentication (default). All endpoints are open. |
| `basic` | Username and password authentication. |
| `oauth2` | OAuth2/OIDC with an external identity provider. |

## What Gets Protected

When authentication is enabled:

- **Protected:** All `/api/*` endpoints (streams, workers, secrets, caches, rate limits) and the web UI dashboard.
- **Not protected:** Stream ingestion endpoints (`/ingest/*`) remain open to allow webhook and data ingestion from external systems. Auth info and login endpoints are also always accessible.

## Basic Authentication

Basic auth provides simple username/password protection. Set these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_TYPE` | Yes | Set to `basic` |
| `AUTH_BASIC_USERNAME` | Yes | Login username |
| `AUTH_BASIC_PASSWORD` | Yes | Login password |
| `SECRET_KEY` | Yes | 32-byte key used for signing JWT tokens |

```bash
export AUTH_TYPE=basic
export AUTH_BASIC_USERNAME=admin
export AUTH_BASIC_PASSWORD=your-secure-password
export SECRET_KEY=this_is_a_32_byte_key_for_AES!!!
```

When basic auth is enabled, the login page shows a username/password form. After successful login, a JWT token is issued and used for subsequent API requests.

### API Usage

To authenticate API requests, first obtain a token:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password"}'
```

Response:

```json
{"token":"eyJhbG...","token_type":"Bearer"}
```

Then include the token in subsequent requests:

```bash
curl http://localhost:8080/api/v1/streams \
  -H "Authorization: Bearer eyJhbG..."
```

## OAuth2 / OIDC Authentication

OAuth2 mode lets you delegate authentication to an external identity provider. Airtruct implements the standard **Authorization Code** flow and works with any OAuth2-compliant provider, including:

- **Keycloak**
- **Okta**
- **Auth0**
- **Google Workspace**
- **Azure AD / Entra ID**
- **Any OIDC-compliant provider**

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_TYPE` | Yes | Set to `oauth2` |
| `AUTH_OAUTH2_CLIENT_ID` | Yes | OAuth2 client ID |
| `AUTH_OAUTH2_CLIENT_SECRET` | Yes | OAuth2 client secret |
| `AUTH_OAUTH2_AUTHORIZATION_URL` | Yes | Provider's authorization endpoint |
| `AUTH_OAUTH2_TOKEN_URL` | Yes | Provider's token endpoint |
| `AUTH_OAUTH2_REDIRECT_URL` | Yes | Callback URL (must be `http(s)://<your-host>/auth/callback`) |
| `AUTH_OAUTH2_SCOPES` | No | Comma-separated scopes (e.g., `openid,email,profile`) |
| `AUTH_OAUTH2_USER_INFO_URL` | No | Provider's user info endpoint |
| `AUTH_OAUTH2_ALLOWED_USERS` | No | Comma-separated list of allowed email addresses |
| `AUTH_OAUTH2_ALLOWED_DOMAINS` | No | Comma-separated list of allowed email domains |
| `AUTH_OAUTH2_SESSION_COOKIE_NAME` | No | Session cookie name (default: `airtruct_session`) |
| `SECRET_KEY` | Yes | 32-byte key used for signing JWT tokens |

### Provider Requirements

To connect any OAuth2/OIDC provider, you need the following from your provider's configuration:

1. **Authorization URL** -- where users are redirected to log in.
2. **Token URL** -- where Airtruct exchanges the authorization code for a token.
3. **User Info URL** -- where Airtruct fetches the user's email after authentication.
4. **Client ID and Secret** -- created when you register Airtruct as an application in your provider.
5. **Redirect URL** -- set to `http(s)://<your-airtruct-host>/auth/callback` in your provider's allowed redirect URIs.

The provider must return a JSON response from the user info endpoint that includes an `email` field.

### Access Restrictions

You can restrict which users can log in using email-based filtering:

- **`AUTH_OAUTH2_ALLOWED_USERS`** -- Only the listed email addresses can access Airtruct. Example: `alice@company.com,bob@company.com`
- **`AUTH_OAUTH2_ALLOWED_DOMAINS`** -- Only users with email addresses from the listed domains can access. Example: `company.com,partner.org`

If neither is set, all authenticated users from the identity provider are allowed.

For a step-by-step setup with Keycloak, see the [Keycloak Authentication](/docs/guides/keycloak-authentication) guide.

## Authentication Flow

When authentication is enabled, the login page adapts automatically:

- **Basic auth:** Shows a username and password form.
- **OAuth2:** Shows a "Sign In" button that redirects to the identity provider.
- **None:** Shows a "Continue to Dashboard" button.

After successful authentication, a JWT token (valid for 24 hours) is issued. The web UI stores this token and includes it in all API requests. When the token expires, the user is redirected back to the login page.

## Security Notes

- JWT tokens are signed with the `SECRET_KEY` using HMAC-SHA256. Use a strong, unique 32-byte key in production.
- Basic auth credentials are compared using constant-time comparison to prevent timing attacks.
- OAuth2 state parameters are validated to prevent CSRF attacks and expire after 10 minutes.
- Tokens expire after 24 hours. Users must re-authenticate after expiration.
