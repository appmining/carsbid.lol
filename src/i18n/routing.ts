import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "es"],
  defaultLocale: "tr",
  localePrefix: "always",
});
