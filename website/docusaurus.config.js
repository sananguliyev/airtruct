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

  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "playbooks",
        path: "playbooks",
        routeBasePath: "playbooks",
        sidebarPath: "./playbooks-sidebars.js",
        editUrl:
          "https://github.com/sananguliyev/airtruct/tree/main/website/",
      },
    ],
  ],

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
            to: "/playbooks",
            label: "Playbooks",
            position: "left",
          },
          {
            href: "https://github.com/sananguliyev/airtruct/releases/latest",
            position: "right",
            className: "navbar-download-link",
            "aria-label": "Download",
          },
          {
            href: "https://github.com/sananguliyev/airtruct",
            position: "right",
            className: "navbar-github-link",
            "aria-label": "GitHub repository",
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
