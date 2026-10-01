import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**"],
  },
  js.configs.recommended,
  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
    },
  },
  {
    files: ["server/src/**/*.js", "server/tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
  },
];