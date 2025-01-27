describe('Invoice to Cash - Pre-Invoicing', () => {
  it('should load the Pre-Invoicing tab without errors', () => {
    cy.visit('http://localhost:4200/invoice-to-cash'); // Navigate to the page
    cy.contains('Pre-Invoicing').click(); // Click on the Pre-Invoicing tab
    cy.get('body').should('contain', 'Process Flow'); // Check that the tab content is loaded
    cy.get(':nth-child(2) > .header-container').click();
    cy.get(
      '#mat-checkbox-1 > .mat-checkbox-layout > .mat-checkbox-inner-container'
    ).click();
    cy.get('#mat-checkbox-1-input').check();
    cy.get('.custom-button-primary').click();
    cy.get('.custom-button-tertiary').click();
    cy.get(
      'app-monitoring-dashboard.ng-star-inserted > :nth-child(1) > .container > .table-container > .mat-table > thead > .mat-header-row > .cdk-column-PROCESS_FLOW > .ng-star-inserted'
    ).click();
    // cy.visit('http://localhost:4200/invoice-to-cash'); // Navigate to the page
  });
});

describe('Invoice to Cash - Invoicing', () => {
  it('Show invoicing without errors, open assign modal, and see process flow', () => {
    cy.visit('http://localhost:4200/invoice-to-cash'); // Navigate to the page
    /* ==== Generated with Cypress Studio ==== */
    cy.get('#mat-tab-label-0-1 > .mat-tab-label-content').click();
    /* ==== End Cypress Studio ==== */

    cy.get('body').should('contain', 'Process Flow'); // Check that the tab content is loaded
    cy.get(':nth-child(2) > .header-container').click();
    cy.get(
      '#mat-checkbox-1 > .mat-checkbox-layout > .mat-checkbox-inner-container'
    ).click();
    cy.get('#mat-checkbox-1-input').check();
    cy.get('.custom-button-primary').click();
    cy.get('.custom-button-tertiary').click();
  });
});

describe('Invoice to Cash - eInvoicing', () => {
  it('Show eInvoicing, assign modal, and process flow', () => {
    cy.visit('http://localhost:4200/invoice-to-cash'); // Navigate to the page
    /* ==== Generated with Cypress Studio ==== */
    cy.get('#mat-tab-label-0-3 > .mat-tab-label-content').click();
    /* ==== End Cypress Studio ==== */

    cy.get('body').should('contain', 'Process Flow'); // Check that the tab content is loaded
    cy.get(':nth-child(2) > .header-container').click();
    cy.get(
      '#mat-checkbox-1 > .mat-checkbox-layout > .mat-checkbox-inner-container'
    ).click();
    cy.get('#mat-checkbox-1-input').check();
    cy.get('.custom-button-primary').click();
    cy.get('.custom-button-tertiary').click();
  });
});
