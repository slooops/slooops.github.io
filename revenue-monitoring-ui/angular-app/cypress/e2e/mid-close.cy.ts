describe('navigate to mid-close', () => {
  it('passes', () => {
    cy.visit('http://localhost:4200/');

    /* ==== Generated with Cypress Studio ==== */
    cy.get('.onHover > svg').click();
    cy.get('[ng-reflect-router-link="/period-close-tracking"] > span').click();
    cy.get('#mat-tab-label-0-1 > .mat-tab-label-content').click();
    /* ==== End Cypress Studio ==== */
  });
});
