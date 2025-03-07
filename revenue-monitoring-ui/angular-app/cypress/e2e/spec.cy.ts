describe('Invoice to Cash', () => {
  it('Tests invoice to cash', () => {
    cy.viewport(1199, 1003);
    cy.visit('http://localhost:4200/invoice-to-cash');

    // Perform common process flow steps on Pre-Invoicing tab
    cy.testProcessFlowAndAssignment();

    // Click on "Invoicing" tab
    cy.contains('.mat-tab-label', 'Invoicing').should('be.visible').click();
    cy.testProcessFlowAndAssignment();

    // Click on "Post-Invoicing" tab
    cy.contains('.mat-tab-label', 'Post-Invoicing')
      .should('be.visible')
      .click();
    cy.testProcessFlowAndAssignment();

    // cy.contains('.mat-tab-label', 'Invoice Delivery')
    //   .should('be.visible')
    //   .click();
    // cy.testProcessFlowAndAssignment();

    // cy.contains('.mat-tab-label', 'Credit Card Payments')
    //   .should('be.visible')
    //   .click();
    // cy.testProcessFlowAndAssignment();

    // cy.contains('.mat-tab-label', 'Debit Card Payments')
    //   .should('be.visible')
    //   .click();
    // cy.testProcessFlowAndAssignment();

    cy.contains('.mat-tab-label', 'eInvoicing').should('be.visible').click();
    cy.testProcessFlowAndAssignment();

    // Click "CMS" tab
    // cy.contains('.mat-tab-label', 'CMS').should('be.visible').click();

    // Click "Fusion" tab
    cy.contains('.mat-tab-label', 'Fusion').should('be.visible').click();
    // cy.testProcessFlowAndAssignment();

    // Click "Operations Controls" tab
    // cy.contains('.mat-tab-label', 'Operations Controls').should('be.visible').click();
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
