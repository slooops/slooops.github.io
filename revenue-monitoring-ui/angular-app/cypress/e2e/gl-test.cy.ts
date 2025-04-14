describe('template spec', () => {
  it('passes', () => {
    cy.viewport(1199, 1003);

    cy.visit('http://localhost:4200/gl-posting');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('GL_BATCH_NAME', 2, '3', 2);
    cy.testTableFilter('ACCOUNT_SEG', 2, '4');
  });
});
