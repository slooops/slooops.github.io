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
  cy.get(
    'app-monitoring-dashboard > div:nth-of-type(1) th.cdk-column-PROCESS_FLOW > span'
  ).click();
  cy.get('app-monitoring-dashboard > div:nth-of-type(1) h5').click();
  cy.get('tr:nth-of-type(1) span.mat-checkbox-inner-container').click();
  cy.get('button.custom-button-primary').click();
  cy.get('button.custom-button-tertiary').click();
  cy.get('h5 button.mat-focus-indicator').click();
});

// Extend the Cypress interface globally
declare global {
  namespace Cypress {
    interface Chainable {
      testProcessFlowAndAssignment(): Chainable<void>;
    }
  }
}

export {}; // Ensure TypeScript treats this as a module
