# Shopify

Fetches data from Shopify stores via the Admin API.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Shop Name | string | — | Shopify shop name |
| API Token | string | — | Shopify Admin API token |
| API Secret Key | string | — | Shopify API secret |
| Resource | string | — | Resource type to fetch |
| Limit | integer | `50` | Results per page |
| Rate Limit | string | — | Rate limit resource name |
| Cache | string | — | Cache for position tracking |

Available resources: `products`, `orders`, `customers`, `inventory_items`, `locations`.
