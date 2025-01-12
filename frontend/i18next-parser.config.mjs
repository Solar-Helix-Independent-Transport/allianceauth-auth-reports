export default {
  locales: ["en"],
  output: "locales/$LOCALE.$NAMESPACE.json",
  namespaceSeparator: "::",
  resetDefaultValueLocale: "en",
  defaultValue: (locale, namespace, key) => key,
  input: ["src/**/*.{js,jsx,ts,tsx}"],
};
