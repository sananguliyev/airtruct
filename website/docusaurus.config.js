// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Airtruct",
  tagline: "ETL Pipelines, Made Simple — scale as you need, without the hassle.",
  favicon: "img/favicon.svg",

  url: "https://airtruct.com",
  baseUrl: "/",

  organizationName: "sananguliyev",
  projectName: "airtruct",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  markdown: {
    mermaid: true,
  },

  themes: ["@docusaurus/theme-mermaid"],

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          editUrl:
            "https://github.com/sananguliyev/airtruct/tree/main/website/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "airtruct",
        logo: {
          alt: "Airtruct Logo",
          src: "img/logo.svg",
          srcDark: "img/logo-dark.svg",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "docsSidebar",
            position: "left",
            label: "Docs",
          },
          {
            href: "https://github.com/sananguliyev/airtruct",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright © ${new Date().getFullYear()} Airtruct. Apache 2.0 License.`,
      },
      prism: {
        theme: require("prism-react-renderer").themes.github,
        darkTheme: require("prism-react-renderer").themes.dracula,
        additionalLanguages: ["bash", "yaml", "sql"],
      },
      colorMode: {
        defaultMode: "light",
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
