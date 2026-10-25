const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**"],
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { args: "none" }],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];
