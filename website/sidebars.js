/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/installation",
        "getting-started/quickstart",
        "getting-started/configuration",
        "getting-started/authentication",
      ],
    },
    {
      type: "category",
      label: "Concepts",
      items: [
        "concepts/architecture",
        "concepts/streams",
        "concepts/components",
        "concepts/files",
        "concepts/validation",
      ],
    },
    {
      type: "category",
      label: "Components",
      items: [
        {
          type: "category",
          label: "Inputs",
          link: { type: "doc", id: "components/inputs/index" },
          items: [
            "components/inputs/generate",
            "components/inputs/http-client",
            "components/inputs/http-server",
            "components/inputs/kafka",
            "components/inputs/amqp-0-9",
            "components/inputs/broker",
            "components/inputs/cdc-mysql",
            "components/inputs/mcp-tool",
            "components/inputs/shopify",
          ],
        },
        {
          type: "category",
          label: "Processors",
          link: { type: "doc", id: "components/processors/index" },
          items: [
            "components/processors/ai-gateway",
            "components/processors/mapping",
            "components/processors/json-schema",
            "components/processors/catch",
            "components/processors/switch",
            "components/processors/schema-registry-decode",
            "components/processors/http-client",
          ],
        },
        {
          type: "category",
          label: "Outputs",
          link: { type: "doc", id: "components/outputs/index" },
          items: [
            "components/outputs/http-client",
            "components/outputs/kafka",
            "components/outputs/amqp-0-9",
            "components/outputs/sql-insert",
            "components/outputs/sync-response",
            "components/outputs/switch",
            "components/outputs/broker",
          ],
        },
        "components/caches",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/kafka-to-postgresql",
        "guides/http-webhooks",
        "guides/scaling-workers",
        "guides/keycloak-authentication",
        "guides/mcp-tool",
      ],
    },
    {
      type: "category",
      label: "Reference",
      items: [
        "reference/cli",
        "reference/environment-variables",
      ],
    },
  ],
};

module.exports = sidebars;
