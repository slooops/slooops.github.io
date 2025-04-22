describe('Invoice to Cash', () => {
  it('Tests invoice to cash', () => {
    cy.viewport(1199, 1003);
    cy.visit('http://localhost:4200/invoice-to-cash');

    // Perform common process flow steps on Pre-Invoicing tab
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('BILL_NUMBER', 2, '3');
    cy.testTableFilter('TRANSACTION_ID', 2, '4');

    // Click on "Invoicing" tab
    cy.contains('.mat-tab-label', 'Invoicing').should('be.visible').click();
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');

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
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');

    cy.contains('.mat-tab-label', 'Digital Payments')
      .should('be.visible')
      .click();
    cy.testProcessFlowAndAssignment();
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

    // Click "Operations Controls" tab
    // cy.contains('.mat-tab-label', 'Operations Controls').should('be.visible').click();

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
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
    cy.testTableFilter('SUBREF-ORDER-NUMBER', 2, '4');

    cy.contains('.mat-tab-label', 'Account Recon').should('be.visible').click();
    cy.testProcessFlowAndAssignment();

    cy.contains('.mat-tab-label', 'Clearing Account Balance')
      .should('be.visible')
      .click();
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
    cy.testTableFilter('SUBREF-ORDER-NUMBER', 2, '4');
  });
});

// describe('Invoice to Cash - Tabs Navigation', () => {
//   it('should navigate through all tabs', () => {
//     cy.viewport(1199, 1003);
//     cy.visit('http://localhost:4200/invoice-to-cash');

//     // Click "Invoicing" tab
//     cy.contains('.mat-tab-label', 'Invoicing').should('be.visible').click();

//     // Click "Post-Invoicing" tab
//     cy.contains('.mat-tab-label', 'Post-Invoicing')
//       .should('be.visible')
//       .click();

//     // Click "eInvoicing" tab
//   });
// });
