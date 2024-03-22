module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
  ],
  plugins: ["@typescript-eslint"],

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
};
