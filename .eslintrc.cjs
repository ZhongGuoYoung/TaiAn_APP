module.exports = {
  parser: "vue-eslint-parser", // 将 vue-eslint-parser 设置为顶级解析器
  plugins: ["@typescript-eslint", "prettier", "vue", "json", "html"],
  env: {
    browser: true,
    node: true,
    "vue/setup-compiler-macros": true,
  },
  extends: [
    "google",
    "prettier",
    "plugin:vue/base",
    "plugin:vue/recommended",
    "plugin:vue/vue3-essential",
    "plugin:vue/vue3-strongly-recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "eslint:recommended",
    "plugin:storybook/recommended",
    "plugin:json/recommended",
    "plugin:tailwindcss/recommended",
  ],
  rules: {
    "vue/multi-word-component-names": "off",
    "require-jsdoc": "off",
    "vue/no-multiple-template-root": "off",
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    extraFileExtensions: [".vue", ".json"],
    ecmaFeatures: {
      jsx: true,
    },
  },
  overrides: [
    {
      files: ["*.vue"],
      parserOptions: {
        parser: "@typescript-eslint/parser", // 对于 <script> 标签内的 JS/TS 使用
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: false,
        },
      },
    },
    {
      files: ["*.ts", "*.tsx", "*.js"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: false,
        },
      },
    },
  ],
};
