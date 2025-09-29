import { defineConfig } from 'cypress';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // Adjust to your app's base URL if needed
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false, // Disable video recording to save resources
    experimentalStudio: true, // Enable experimental Studio feature
    scrollBehavior: false,

    setupNodeEvents(on, config) {
      // Warning logging tasks
      on('task', {
        logWarning(warningData: {
          timestamp: string;
          context: string;
          message: string;
        }) {
          const warningLogFile = path.join(__dirname, 'cypress-warnings.log');
          const logEntry = `${warningData.timestamp} [${warningData.context}] ${warningData.message}\n`;

          try {
            fs.appendFileSync(warningLogFile, logEntry);
          } catch (error) {
            console.warn(
              'Could not write to warning log file:',
              (error as Error).message
            );
          }

          return null;
        },

        reportWarnings(data: {
          testName: string;
          count: number;
          warnings: Array<{
            timestamp: string;
            context: string;
            message: string;
          }>;
        }) {
          console.log('\n' + '='.repeat(60));
          console.log(`🚨 TEST WARNINGS SUMMARY: "${data.testName}"`);
          console.log(`   Total Warnings: ${data.count}`);
          console.log('='.repeat(60));

          data.warnings.forEach((warning, index) => {
            console.log(
              `   ${index + 1}. [${warning.timestamp}] [${warning.context}] ${
                warning.message
              }`
            );
          });

          console.log('='.repeat(60) + '\n');

          return null;
        },

        clearWarningLog() {
          const warningLogFile = path.join(__dirname, 'cypress-warnings.log');
          try {
            if (fs.existsSync(warningLogFile)) {
              fs.unlinkSync(warningLogFile);
            }
          } catch (error) {
            console.warn(
              'Could not clear warning log file:',
              (error as Error).message
            );
          }
          return null;
        },
      });

      return config;
    },

    // Optional: Add environment variable to control visual warnings
    env: {
      showVisualWarnings: true,
    },
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
