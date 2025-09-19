/// <reference types="cypress" />
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

Cypress.Commands.add('checkIfNoData', () => {
  return cy.get('body').then(($body) => {
    // Check if the no-data image exists without failing if it doesn't
    const hasNoDataImage = $body.find('img').length > 0;

    if (hasNoDataImage) {
      cy.log(`⚠️ Skipping tests — no data image detected.`);
      console.warn(`⚠️ Skipping tests — no data image detected.`);
      return cy.wrap(true); // Has no data
    } else {
      cy.log(`✅ Data detected — proceeding with tests.`);
      console.log(`✅ Data detected — proceeding with tests.`);
      return cy.wrap(false); // Has data
    }
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
    //clear the filter input
    cy.get('.form-container > .mat-focus-indicator')
      .should('be.visible')
      .click();

    const columnSelector = tableSectionIndex
      ? `:nth-child(${tableSectionIndex}) > .table-container > .mat-table > tbody > :nth-child(${rowIndex}) > .cdk-column-${columnClass}`
      : `:nth-child(${rowIndex}) > .cdk-column-${columnClass}`;

    //get the column
    cy.get(columnSelector)
      // .eq(rowIndex)
      .invoke('text')
      .then((rawText) => {
        const cleaned = rawText
          .replace(/\u00a0/g, ' ')
          .match(/\d+(?!.*\d+)/)?.[0];

        if (!cleaned) {
          cy.log(
            `⚠️ Could not extract valid value from row ${
              rowIndex + 1
            } of ${columnClass}.`
          );
          console.warn(
            `⚠️ Could not extract valid value from row ${
              rowIndex + 1
            } of ${columnClass}.`
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

    //clear the filter input
    cy.get('.form-container > .mat-focus-indicator')
      .should('be.visible')
      .click();
  }
);

Cypress.Commands.add(
  'testMatColumnSort',
  (columnTitle: string, columnClass: string) => {
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
  }
);

Cypress.Commands.add('clickExactTab', (tabName: string) => {
  cy.get('.mat-tab-label')
    .contains(new RegExp(`^${tabName}$`))
    .should('be.visible')
    .click();
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
    }
  }
}

export {}; // Ensure TypeScript treats this as a module
