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
      ],
    },
    {
      type: "category",
      label: "Concepts",
      items: [
        "concepts/architecture",
        "concepts/streams",
        "concepts/components",
      ],
    },
    {
      type: "category",
      label: "Components",
      items: [
        "components/inputs",
        "components/processors",
        "components/outputs",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/kafka-to-postgresql",
        "guides/http-webhooks",
        "guides/scaling-workers",
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
