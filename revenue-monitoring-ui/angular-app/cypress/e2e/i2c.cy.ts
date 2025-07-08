describe('Invoice to Cash', () => {
  it('Tests invoice to cash', () => {
    cy.viewport(1199, 1003);
    cy.visit('http://localhost:4200/invoice-to-cash');

    // Perform common process flow steps on Pre-Invoicing tab
    cy.testProcessFlowAndAssignment();
    cy.testMatColumnSort('Aging"', 'AGING');

    cy.testTableFilter('BILL_NUMBER', 2, '3');
    cy.testTableFilter('TRANSACTION_ID', 2, '4');

    // Click on "Invoicing" tab
    // cy.contains('.mat-tab-label', 'Invoicing').should('be.visible').click();
    // cy.testProcessFlowAndAssignment();
    // cy.testTableFilter('TRANSACTION_ID', 2, '3');

    // Click on "Post-Invoicing" tab
    cy.contains('.mat-tab-label', 'Post-Invoicing')
      .should('be.visible')
      .click();
    // cy.testProcessFlowAndAssignment();

    cy.contains('.mat-tab-label', 'CM Amortization')
      .should('be.visible')
      .click();
    cy.checkIfNoData().then((hasNoData) => {
      if (hasNoData) return;
      cy.testProcessFlowAndAssignment();
    });

    cy.contains('.mat-tab-label', 'Invoice Delivery')
      .should('be.visible')
      .click();
    cy.checkIfNoData().then((hasNoData) => {
      if (hasNoData) return;
      cy.testProcessFlowAndAssignment();
      cy.testTableFilter('TRANSACTION_ID', 2, '3');
    });

    cy.contains('.mat-tab-label', 'Digital Payments')
      .should('be.visible')
      .click();
    // cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');

    cy.contains('.mat-tab-label', 'eInvoicing').should('be.visible').click();
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');

    // Click "CMS" tab
    // cy.contains('.mat-tab-label', 'CMS').should('be.visible').click();

    // Click "Fusion" tab
    cy.contains('.mat-tab-label', 'Fusion').should('be.visible').click();
    cy.checkIfNoData().then((hasNoData) => {
      if (hasNoData) return;
      cy.testProcessFlowAndAssignment();
    });
  });
});
