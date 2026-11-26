import { defineConfig, markdown, godoc } from "sourcey";

const PIN = "284f7c889533b78603191349f4a5c48628d7afd2";

export default defineConfig({
  name: "zerolog",
  siteUrl: "https://zerolog-docs.readthedocs.io",
  baseUrl: "/en/latest/",
  navbar: {
    links: [
      { type: "github", href: "https://github.com/rs/zerolog" },
    ],
  },
  footer: {
    text: `zerolog is MIT licensed. Documented version: rs/zerolog @ ${PIN.slice(0, 7)} (10 Nov 2026).`,
    links: [
      { type: "github", href: "https://github.com/rs/zerolog" },
    ],
  },
  navigation: {
    tabs: [
      {
        tab: "Docs",
        slug: "",
        source: markdown({
          groups: [
            { group: "Get started", pages: ["index", "quickstart"] },
            {
              group: "Guides",
              pages: [
                "guides/levels-sampling",
                "guides/context-fields",
                "guides/writers-output",
                "guides/integrations",
                "guides/performance",
              ],
            },
          ],
        }),
      },
      {
        tab: "Go API",
        slug: "api",
        source: godoc({
          module: "./zerolog",
          packages: ["."],
          mode: "snapshot",
          snapshot: "./zerolog/godoc.json",
          sourceBasePath: `https://github.com/rs/zerolog/blob/${PIN}/`,
        }),
      },
    ],
  },
});
