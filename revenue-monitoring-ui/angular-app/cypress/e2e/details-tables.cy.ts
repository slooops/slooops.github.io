import exp from 'constants';

describe('Accounts Test Demo', () => {
  it('Tests accounts page', () => {
    cy.viewport(1199, 1003);
    cy.visit('http://localhost:4200/accounts');

    // Perform common process flow steps on Pre-Invoicing tab
    cy.testProcessFlowAndAssignment();

    cy.testTableFilter('SUBREF-ORDER-NUMBER', 2, '3');
    cy.testTableFilter('TRANSACTION_ID', 2, '4');
  });
});
