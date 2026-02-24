---
sidebar_position: 4
---

# Keycloak Authentication

This guide walks through setting up Airtruct with Keycloak as an OAuth2/OIDC identity provider. Airtruct ships with a pre-configured Keycloak realm for quick setup using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Airtruct running or ready to start

## Start Keycloak

Airtruct's Docker Compose includes a Keycloak profile with a pre-configured `airtruct` realm and client.

```bash
docker-compose --profile keycloak up -d
```

Keycloak will be available at `http://localhost:8090` with admin credentials `admin` / `admin`.

## Configure Airtruct

Set the following environment variables to connect Airtruct to Keycloak:

```bash
export AUTH_TYPE=oauth2
export AUTH_OAUTH2_CLIENT_ID=airtruct
export AUTH_OAUTH2_CLIENT_SECRET=airtruct-secret-change-in-production
export AUTH_OAUTH2_AUTHORIZATION_URL=http://localhost:8090/realms/airtruct/protocol/openid-connect/auth
export AUTH_OAUTH2_TOKEN_URL=http://keycloak:8080/realms/airtruct/protocol/openid-connect/token
export AUTH_OAUTH2_REDIRECT_URL=http://localhost:8080/auth/callback
export AUTH_OAUTH2_SCOPES=openid,email,profile
export AUTH_OAUTH2_USER_INFO_URL=http://keycloak:8080/realms/airtruct/protocol/openid-connect/userinfo
```

:::tip
The authorization URL uses `localhost:8090` because it's accessed from the user's browser. The token and user info URLs use `keycloak:8080` because they're accessed server-side within the Docker network.
:::

## Create Users

1. Open `http://localhost:8090` and log in with `admin` / `admin`.
2. Select the **airtruct** realm.
3. Go to **Users** and click **Add user**.
4. Fill in a username and email address, then click **Create**.
5. Go to the **Credentials** tab and set a password.

You can now log in to Airtruct using the credentials you created.

## Restrict Access

To limit which users can access Airtruct, use email-based filtering:

```bash
# Allow only specific users
export AUTH_OAUTH2_ALLOWED_USERS=alice@company.com,bob@company.com

# Or allow entire domains
export AUTH_OAUTH2_ALLOWED_DOMAINS=company.com
```

See [Authentication](/docs/getting-started/authentication#access-restrictions) for more details.

## Production Considerations

:::warning
The pre-configured realm and client secret are for development only.
:::

For production deployments:

- Create your own Keycloak realm and client with a strong client secret.
- Enable HTTPS on both Keycloak and Airtruct.
- Update the authorization, token, and user info URLs to use your production Keycloak domain.
- Set `AUTH_OAUTH2_REDIRECT_URL` to your production Airtruct URL (e.g., `https://airtruct.example.com/auth/callback`).
- Configure the Keycloak client's **Valid redirect URIs** to match your production redirect URL.
