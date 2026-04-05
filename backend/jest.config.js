/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  clearMocks: true
};
