// describe('Example Test', () => {
//   it('Visits Preclose', () => {
//     cy.visit('/');
//     cy.get('.onHover > svg').click();
//     cy.get('.active > span').click();
//     cy.visit('/period-close-tracking');
//   });
// });

describe('Test the filters', () => {
  it('clicks statuses', () => {
    cy.visit('/period-close-tracking');
    cy.get('[data-cy=preclose-statuses]').click();
    // cy.get('#mat-select-value-27').click();
    // cy.get('#mat-option-78 > .mat-option-text').click();
    // cy.get('#mat-option-79 > .mat-option-text').click();
    // cy.get('#mat-option-79 > .mat-option-text').click();
    // cy.get('#mat-option-80 > .mat-option-text').click();
    // cy.get('#mat-option-80 > .mat-option-text').click();

    cy.contains('mat-option', 'Completed').click();
    cy.contains('mat-option', 'NA').click();
    cy.contains('mat-option', 'All').click();

    cy.get('.cdk-overlay-backdrop').click();
  });

  it('clicks entites', () => {
    cy.get('[data-cy=preclose-statuses]').click();
    // cy.get('#mat-select-value-25').click();
    // cy.get('#mat-option-59 > .mat-option-text').click();
    // cy.get('#mat-option-60 > .mat-option-text').click();
    // cy.get('#mat-option-65 > .mat-option-text').click();
    cy.get('.cdk-overlay-backdrop').click();
  });
});
// describe('Test the filters', () => {
//   it('clicks entites', () => {
//     cy.get('[data-cy=preclose-statuses]').click();
//     // cy.get('#mat-select-value-25').click();
//     // cy.get('#mat-option-59 > .mat-option-text').click();
//     // cy.get('#mat-option-60 > .mat-option-text').click();
//     // cy.get('#mat-option-65 > .mat-option-text').click();
//     cy.get('.cdk-overlay-backdrop').click();
//   });
// });

// cy.visit('/period-close-tracking');
