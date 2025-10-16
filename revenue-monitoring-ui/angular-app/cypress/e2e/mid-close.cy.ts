// describe('navigate to mid-close', () => {
//   it('passes', () => {
//     cy.visit('/');

//     /* ==== Generated with Cypress Studio ==== */
//     cy.get('.onHover > svg').click();
//     cy.get('[ng-reflect-router-link="/period-close-tracking"] > span').click();
//     cy.get('#mat-tab-label-0-1 > .mat-tab-label-content').click();
//     /* ==== End Cypress Studio ==== */
//   });
// });

describe('midclose test', () => {
  it('tests midclose test', () => {
    cy.viewport(1199, 1003);
    cy.visit('/home');
    cy.get('div.navbar > ul > li:nth-of-type(2) > a').click();
    cy.get('#mat-tab-label-1-1 > div').click();
    cy.get('#mat-option-63').click();
    cy.get('#mat-option-64 > mat-pseudo-checkbox').click();
    cy.get('#mat-option-64 > mat-pseudo-checkbox').click();
    cy.get('#mat-option-65 > mat-pseudo-checkbox').click();
    cy.get('div.cdk-overlay-backdrop').click();
  });
});
