describe('Revenue Accounting', () => {
  it('Tests tabs in rev accting', () => {
    cy.viewport(1199, 1003);

    cy.visit('http://localhost:4200/revenue-accounting');
    //this opens to standard revenue
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');

    cy.contains('.mat-tab-label', 'Revenue Orchestration Layer')
      .should('be.visible')
      .click();
    cy.testProcessFlowAndAssignment();

    cy.contains('.mat-tab-label', 'Accruals').should('be.visible').click();
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 1, '4');
    cy.testTableFilter('SUBREF-ORDER-NUMBER', 1, '3');

    // cy.contains('.mat-tab-label', 'Account Recon').should('be.visible').click();
    // cy.testProcessFlowAndAssignment();

    cy.contains('.mat-tab-label', 'Clearing Account Balance')
      .should('be.visible')
      .click();
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('SUBREF-ORDER-NUMBER', 2, '3');
    cy.testTableFilter('TRANSACTION_ID', 2, '4');
  });
});
