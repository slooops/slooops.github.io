import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // Adjust to your app's base URL if needed
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false, // Disable video recording to save resources
    experimentalStudio: true, // Enable experimental Studio feature
    scrollBehavior: false,
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts',
  },

  defaultCommandTimeout: 10000, // 10 seconds
  pageLoadTimeout: 60000, // time for full page load
});
