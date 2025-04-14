import exp from 'constants';

describe('Accounts Test Demo', () => {
  it('Tests accounts page', () => {
    cy.viewport(1199, 1003);
    cy.visit('http://localhost:4200/accounts');

    // Perform common process flow steps on Pre-Invoicing tab
    cy.testProcessFlowAndAssignment();

    cy.testTableFilter('SUBREF-ORDER-NUMBER', 3, '3');
    cy.testTableFilter('TRANSACTION_ID', 2, '4');

    cy.visit('http://localhost:4200/accruals');
    cy.checkIfNoData().then((hasNoData) => {
      if (hasNoData) return;

      // ✅ Only runs if data is found
      cy.testProcessFlowAndAssignment();
      cy.testTableFilter('TRANSACTION_ID', 2, '3');
      cy.testTableFilter('SUBREF-ORDER-NUMBER', 2, '4');
    });

    cy.visit('http://localhost:4200/gl-posting');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('GL_BATCH_NAME', 2, '3', 2);
    cy.testTableFilter('ACCOUNT_SEG', 2, '4');
    // cy.checkIfNoData().then((hasNoData) => {
    //   if (hasNoData) return;

    //   // ✅ Only runs if data is found
    //   cy.testProcessFlowAndAssignment();
    //   cy.testTableFilter('GL_BATCH_NAME', 2, '3', 2);
    //   cy.testTableFilter('ACCOUNT_SEG', 2, '4');
    // });
  });
});
