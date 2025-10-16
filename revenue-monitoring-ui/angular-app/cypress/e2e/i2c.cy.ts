describe('Invoice to Cash', () => {
  beforeEach(() => {
    cy.viewport(1199, 1003);
    cy.visit('/error');
    cy.get('li:nth-of-type(2) > a').click();
    cy.get('button:nth-of-type(2)').click();
  });

  it('Tests Pre-Invoicing tab', () => {
    // Pre-Invoicing tab should be active by default
    cy.log('🔍 Testing Pre-Invoicing tab');
    cy.testProcessFlowAndAssignment();
    cy.testMatColumnSort('Aging', 'AGING');
    cy.testTableFilter('BILL_NUMBER', 2, '3');
    cy.testTableFilter('TRANSACTION_ID', 2, '4');
  });

  it('Tests Invoicing tab', () => {
    cy.clickExactTab('Invoicing');
    cy.log('🔍 Testing Invoicing tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests Post-Invoicing tab', () => {
    cy.clickExactTab('Post-Invoicing');
    cy.log('🔍 Testing Post-Invoicing tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests CM Amortization tab', () => {
    cy.navigateToSubTab('CM Amortization');
    cy.log('🔍 Testing CM Amortization tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests Invoice Delivery tab', () => {
    cy.navigateToSubTab('Invoice Delivery');
    cy.log('🔍 Testing Invoice Delivery tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests Digital Payments tab', () => {
    cy.navigateToSubTab('Digital Payments');
    cy.log('🔍 Testing Digital Payments tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests SRT Process tab', () => {
    cy.navigateToSubTab('SRT Process');
    cy.log('🔍 Testing SRT Process tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests RPO Extract tab', () => {
    cy.navigateToSubTab('RPO Extract');
    cy.log('🔍 Testing RPO Extract tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests PCM Application tab', () => {
    cy.navigateToSubTab('PCM Application');
    cy.log('🔍 Testing PCM Application tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests eInvoicing tab', () => {
    cy.clickExactTab('eInvoicing');
    cy.log('🔍 Testing eInvoicing tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests Fusion tab', () => {
    cy.clickExactTab('Fusion');
    cy.log('🔍 Testing Fusion tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  it('Tests Credit Check Process tab', () => {
    cy.clickExactTab('Credit Check Process');
    cy.log('🔍 Testing Credit Check Process tab');
    cy.testProcessFlowAndAssignment();
    cy.testTableFilter('TRANSACTION_ID', 2, '3');
  });

  afterEach(() => {
    // Report warnings at the end of each test
    cy.reportWarnings();
  });

  // Comprehensive test that runs through all tabs in sequence
  // it('Tests all tabs in sequence', () => {
  //   const topLevelTabs = [
  //     'Pre-Invoicing', // Default active tab
  //     'Invoicing',
  //     'Post-Invoicing',
  //     'eInvoicing',
  //     'Fusion',
  //     'Credit Check Process',
  //     'CMS',
  //   ];

  //   const postInvoicingSubTabs = [
  //     'CM Amortization',
  //     'Invoice Delivery',
  //     'Digital Payments',
  //     'SRT Process',
  //     'RPO Extract',
  //     'PCM Application',
  //   ];

  //   // Test top-level tabs first
  //   topLevelTabs.forEach((tabName, index) => {
  //     if (index > 0) {
  //       // Skip clicking for first tab as it's already active
  //       cy.clickExactTab(tabName);
  //     }

  //     cy.log(`🔍 Testing ${tabName} tab (${index + 1}/${topLevelTabs.length})`);
  //     cy.testProcessFlowAndAssignment();

  //     // Test different filters for variety
  //     if (tabName === 'Pre-Invoicing') {
  //       cy.testTableFilter('BILL_NUMBER', 2, '3');
  //       cy.testTableFilter('TRANSACTION_ID', 2, '4');
  //     } else if (tabName !== 'Post-Invoicing') {
  //       // Skip testing filters on Post-Invoicing parent tab since we'll test sub-tabs
  //       cy.testTableFilter('TRANSACTION_ID', 2, '3');
  //     }
  //   });

  //   // Test Post-Invoicing sub-tabs
  //   postInvoicingSubTabs.forEach((subTabName, index) => {
  //     cy.navigateToSubTab(subTabName);

  //     cy.log(
  //       `🔍 Testing ${subTabName} sub-tab (${index + 1}/${
  //         postInvoicingSubTabs.length
  //       })`
  //     );
  //     cy.testProcessFlowAndAssignment();
  //     cy.testTableFilter('TRANSACTION_ID', 2, '3');
  //   });
  // });
});
