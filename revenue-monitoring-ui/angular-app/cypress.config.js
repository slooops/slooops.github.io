// Minimal Cypress config in JS to avoid TypeScript transpilation in Docker image
module.exports = {
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.ts",
    baseUrl:
      process.env.TEST_BASE_URL ||
      "https://operations-control-tower-stg.cisco.com",
    supportFile: "cypress/support/e2e.ts",
    video: false,
  },
};
