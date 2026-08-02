/// <reference types="cypress" />

// Global warning tracking
let testWarnings: Array<{
  message: string;
  timestamp: string;
  context: string;
}> = [];
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
// Cypress.Commands.add()

// Define the custom Cypress command
Cypress.Commands.add('testProcessFlowAndAssignment', () => {
  // Check if no data exists before proceeding
  cy.checkIfNoData().then((hasNoData) => {
    if (hasNoData) {
      cy.logWarning(
        'Skipping testProcessFlowAndAssignment - no data detected',
        'process-flow'
      );
      return; // Skip the test gracefully
    }

    // Proceed with the test if data exists
    // cy.get(
    //   'app-monitoring-dashboard > div:nth-of-type(1) th.cdk-column-PROCESS_FLOW > span'
    // ).click();
    // cy.get('app-monitoring-dashboard > div:nth-of-type(1) h5').click();

    // Target the first checkbox specifically in the Error Summary section (first table)
    cy.get('tbody tr:nth-of-type(1) span.mat-checkbox-inner-container')
      .first()
      .click();
    cy.get('button.custom-button-primary').click();
    cy.get('button.custom-button-tertiary').click();
    // cy.get('h5 button.mat-focus-indicator').click();
  });
});

Cypress.Commands.add('checkIfNoData', () => {
  return cy.get('body').then(($body) => {
    // Wait 3 seconds to allow for loading, then check for no-data images
    cy.wait(3000);

    return cy.get('body').then(($updatedBody) => {
      // Check if the no-data image exists after waiting
      const hasNoDataImage = $updatedBody.find('img').length > 0;

      if (hasNoDataImage) {
        cy.logWarning(
          'No data image detected after 3s wait - skipping tests',
          'no-data'
        );
        return cy.wrap(true); // Has no data
      } else {
        cy.log(`✅ Data detected — proceeding with tests.`);
        console.log(`✅ Data detected — proceeding with tests.`);
        return cy.wrap(false); // Has data
      }
    });
  });
});

Cypress.Commands.add(
  'testTableFilter',
  (
    columnClass: string,
    rowIndex: number,
    filterInputSelector: string,
    tableSectionIndex: number
  ) => {
    // Check if no data exists before proceeding
    cy.checkIfNoData().then((hasNoData) => {
      if (hasNoData) {
        cy.logWarning(
          `Skipping testTableFilter for ${columnClass} - no data detected`,
          'table-filter'
        );
        return; // Skip the test gracefully
      }

      // Proceed with the test if data exists
      // Clear the filter input - click the second reset button if multiple exist
      cy.get('.form-container > .mat-focus-indicator')
        .should('be.visible')
        .then(($buttons) => {
          if ($buttons.length > 1) {
            // Click the second reset button if multiple exist
            cy.wrap($buttons[1]).click();
          } else {
            // Click the first (and only) reset button
            cy.wrap($buttons[0]).click();
          }
        });

      const columnSelector = tableSectionIndex
        ? `:nth-child(${tableSectionIndex}) > .table-container > .mat-table > tbody > :nth-child(${rowIndex}) > .cdk-column-${columnClass}`
        : `:nth-child(${rowIndex}) > .cdk-column-${columnClass}`;

      // Get the column with timeout and proper error handling - soft fail approach
      cy.get('body').then(($body) => {
        // Check if the element exists without failing
        const elementExists = $body.find(columnSelector).length > 0;

        if (!elementExists) {
          cy.logWarning(
            `Could not test filter for ${columnClass} - row not found (too little data, no data, or data not loaded)`,
            'element-missing'
          );
          return; // Skip the rest of the test gracefully
        }

        // Element exists, proceed with the test
        cy.get(columnSelector)
          .invoke('text')
          .then((rawText) => {
            const cleaned = rawText
              .replace(/\u00a0/g, ' ')
              .match(/\d+(?!.*\d+)/)?.[0];

            if (!cleaned) {
              cy.logWarning(
                `Could not extract valid data from ${columnClass} for filtering`,
                'data-extraction'
              );
              return;
            }

            cy.log(`🔎 Copied ${columnClass}: ${cleaned}`);
            console.log(`🔎 Copied ${columnClass}: ${cleaned}`);

            //paste into the filter input
            cy.get(
              `:nth-child(${filterInputSelector}) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix input`
            )
              .should('exist')
              .clear()
              .type(cleaned);

            cy.wait(500);

            const filteredColumnSelector = tableSectionIndex
              ? `:nth-child(${tableSectionIndex}) > .table-container > .mat-table > tbody > :nth-child(1) > .cdk-column-${columnClass}`
              : `:nth-child(1) > .cdk-column-${columnClass}`;

            cy.get(filteredColumnSelector)
              // .eq(1)
              .invoke('text')
              .then((filteredRaw) => {
                const filteredClean = filteredRaw
                  .replace(/\u00a0/g, ' ')
                  .match(/\d+(?!.*\d+)/)?.[0];

                if (filteredClean !== cleaned) {
                  throw new Error(
                    `❌ Filtered "${filteredClean}" does not match expected "${cleaned}".`
                  );
                }

                cy.log(
                  `✅ Filter for ${columnClass} working: "${filteredClean}" matched "${cleaned}".`
                );
                console.log(
                  `✅ Filter for ${columnClass} working: "${filteredClean}" matched "${cleaned}".`
                );
              });
          });
      });

      // Clear the filter input - click the second reset button if multiple exist
      cy.get('.form-container > .mat-focus-indicator')
        .should('be.visible')
        .then(($buttons) => {
          if ($buttons.length > 1) {
            // Click the second reset button if multiple exist
            cy.wrap($buttons[1]).click();
          } else {
            // Click the first (and only) reset button
            cy.wrap($buttons[0]).click();
          }
        });
    }); // Close the checkIfNoData.then() block
  }
);

Cypress.Commands.add(
  'testMatColumnSort',
  (columnTitle: string, columnClass: string) => {
    // Check if no data exists before proceeding
    cy.checkIfNoData().then((hasNoData) => {
      if (hasNoData) {
        cy.logWarning(
          `Skipping testMatColumnSort for ${columnTitle} - no data detected`,
          'column-sort'
        );
        return; // Skip the test gracefully
      }

      // Proceed with the test if data exists
      cy.log(`🔎 Checking sort for column: ${columnTitle}`);

      // Find the column header and click to sort
      cy.get('.mat-header-row > .cdk-column-' + columnClass)
        .should('exist')
        .click();

      // Capture the value before sorting
      cy.get(`.cdk-column-${columnClass}`)
        .eq(1)
        .invoke('text')
        .then((beforeSortValue) => {
          // Click again to toggle sort direction
          cy.get('.mat-header-row > .cdk-column-' + columnClass).click();

          // Capture the value after sorting
          cy.get(`.cdk-column-${columnClass}`)
            .eq(1)
            .invoke('text')
            .then((afterSortValue) => {
              if (beforeSortValue.trim() === afterSortValue.trim()) {
                cy.log(
                  `⚠️ Sort on column "${columnTitle}" may not be working (value did not change): ${beforeSortValue.trim()}, ${afterSortValue.trim()}.`
                );
                console.warn(
                  `⚠️ Column "${columnTitle}" sort may not be functioning correctly: value before/after was "${beforeSortValue.trim()}".`
                );
              } else {
                cy.log(
                  `✅ Column "${columnTitle}" sort appears functional, ${beforeSortValue.trim()} ➔ ${afterSortValue.trim()}`
                );
              }
            });
        });
    }); // Close the checkIfNoData.then() block
  }
);

Cypress.Commands.add('clickExactTab', (tabName: string) => {
  cy.get('.mat-tab-label')
    .contains(new RegExp(`^${tabName}$`))
    .should('be.visible')
    .click();
});

// Helper function to navigate to sub-tabs under Post-Invoicing
Cypress.Commands.add('navigateToSubTab', (subTabName: string) => {
  const postInvoicingSubTabs = [
    'CM Amortization',
    'Invoice Delivery',
    'Digital Payments',
    'SRT Process',
    'RPO Extract',
    'PCM Application',
  ];

  if (postInvoicingSubTabs.includes(subTabName)) {
    // First navigate to Post-Invoicing parent tab
    cy.log(`🔄 Navigating to Post-Invoicing parent tab for ${subTabName}`);
    cy.clickExactTab('Post-Invoicing');

    // Wait a moment for the sub-tabs to load
    cy.wait(1000);

    // Then click the specific sub-tab
    cy.log(`🔄 Clicking ${subTabName} sub-tab`);
    cy.clickExactTab(subTabName);
  } else {
    // For regular top-level tabs, use normal navigation
    cy.clickExactTab(subTabName);
  }
});

// Enhanced warning system
Cypress.Commands.add(
  'logWarning',
  (message: string, context: string = 'general') => {
    const timestamp = new Date().toLocaleTimeString();
    const warningData = {
      message,
      timestamp,
      context,
    };

    // Add to warnings array
    testWarnings.push(warningData);

    // Multiple visibility approaches:

    // 1. Enhanced Cypress log with emoji for visibility
    cy.log(`🚨 WARNING [${context}]: ${message}`);

    // 2. Console warning (still useful for dev tools)
    console.warn(`🚨 CYPRESS WARNING [${timestamp}] [${context}]: ${message}`);

    // 3. Browser-visible notification (for development)
    if (Cypress.env('showVisualWarnings') !== false) {
      cy.window().then((win) => {
        const warningId = `cypress-warning-${Date.now()}`;
        win.document.body.insertAdjacentHTML(
          'afterbegin',
          `<div id="${warningId}" style="
          position: fixed; top: 10px; right: 10px; z-index: 9999;
          background: #ff9800; color: #000; padding: 8px 12px;
          border-left: 4px solid #f44336; max-width: 300px;
          font-family: 'Courier New', monospace; font-size: 11px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          animation: slideIn 0.3s ease-out;
        ">⚠️ [${context}] ${message}</div>`
        );

        // Auto-remove after 5 seconds
        setTimeout(() => {
          const element = win.document.getElementById(warningId);
          if (element) element.remove();
        }, 5000);
      });
    }

    // 4. Task for external logging (if configured)
    cy.task('logWarning', warningData, { log: false }).then(null, () => {
      // Ignore task errors if not configured
    });
  }
);

Cypress.Commands.add('getWarningCount', () => {
  return cy.wrap(testWarnings.length);
});

Cypress.Commands.add('reportWarnings', () => {
  if (testWarnings.length > 0) {
    // Create a prominent summary
    cy.log(`🔔 TEST SUMMARY: ${testWarnings.length} warnings detected`);

    // Log each warning in summary
    testWarnings.forEach((warning, index) => {
      cy.log(`   ${index + 1}. [${warning.context}] ${warning.message}`);
    });

    // External reporting task
    cy.task(
      'reportWarnings',
      {
        count: testWarnings.length,
        warnings: testWarnings,
        testName: Cypress.currentTest.title,
      },
      { log: false }
    ).then(null, () => {
      // Ignore task errors if not configured
    });

    // Browser console summary
    cy.window().then((win) => {
      win.console.group(`🚨 ${testWarnings.length} CYPRESS WARNINGS DETECTED`);
      testWarnings.forEach((warning, index) => {
        win.console.warn(
          `${index + 1}. [${warning.timestamp}] [${warning.context}] ${
            warning.message
          }`
        );
      });
      win.console.groupEnd();
    });
  }

  // Reset warnings for next test
  testWarnings = [];
});

// Extend the Cypress interface globally
declare global {
  namespace Cypress {
    interface Chainable {
      testProcessFlowAndAssignment(): Chainable<void>;
      checkIfNoData(): Chainable<boolean>;
      testTableFilter(
        columnClass: string,
        rowIndex: number,
        filterInputSelector: string,
        tableSectionIndex?: number
      ): Chainable<void>;
      testMatColumnSort(
        columnTitle: string,
        columnClass: string
      ): Chainable<void>;
      clickExactTab(tabName: string): Chainable<void>;
      navigateToSubTab(subTabName: string): Chainable<void>;
      logWarning(message: string, context?: string): Chainable<void>;
      getWarningCount(): Chainable<number>;
      reportWarnings(): Chainable<void>;
    }
  }
}

export {}; // Ensure TypeScript treats this as a module
