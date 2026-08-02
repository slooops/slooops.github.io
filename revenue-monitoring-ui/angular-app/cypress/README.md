# Revenue Operations Monitoring - Cypress Tests

## Overview

This directory contains Cypress E2E tests for the Revenue Operations Monitoring application. The tests validate various workflows, interactions, and UI components across different sections of the application.

## Test Structure

### Commands File

**Location**: `cypress/support/commands.ts`

This file contains custom Cypress commands that are reused across multiple test files. These commands encapsulate common test actions to improve readability and maintainability.

Key custom commands:

- `testProcessFlowAndAssignment`: Tests the process flow and assignment functionality
- `checkIfNoData`: Checks if a page has no data and returns a boolean
- `testTableFilter`: Tests table filtering functionality for a specified column
- `testMatColumnSort`: Tests the sorting functionality for a material table column

### Test Files

#### 1. `spec.cy.ts`

**Primary test file** covering the Invoice to Cash flow.

- Tests navigation through tabs (Pre-Invoicing, Invoicing, Post-Invoicing, etc.)
- Tests filters, table sorting, and data display
- Conditionally runs tests based on data availability

#### 2. `i2c.cy.ts`

Similar to `spec.cy.ts` but with a more focused test on Invoice to Cash specific functionality.

- Tests matrix column sorting
- Verifies specific tabs like CM Amortization, Invoice Delivery, Digital Payments
- Includes comprehensive error handling for empty data scenarios

#### 3. `details-tables.cy.ts`

Tests for account detail tables:

- Tests the accounts page
- Validates GL posting functionality
- Tests table filters for specific columns

#### 4. `gl-test.cy.ts`

Focused test for GL Posting functionality:

- Tests process flow assignment
- Tests table filters for GL_BATCH_NAME and ACCOUNT_SEG

#### 5. `pre-close.cy.ts`

Tests for the Period Close Tracking functionality:

- Tests filter statuses (Completed, NA, All)
- Tests entity filtering
- Tests overlay and backdrop interactions

## Running Tests

To run these tests, use the following commands:

```bash
# Run all tests
npm run cypress:run

# Open Cypress Test Runner
npm run cypress:open

# Run a specific test file
npm run cypress:run -- --spec "cypress/e2e/spec.cy.ts"
```

## Test Pattern

Most tests follow this general pattern:

1. Navigate to a page
2. Check if data exists (using `checkIfNoData`)
3. If data exists, perform process flow and assignment tests
4. Test table filters and column sorting
5. Navigate to different tabs and repeat

## Best Practices Used

1. **Reusable Commands**: Common actions are extracted into custom commands
2. **Conditional Testing**: Tests adapt based on data availability
3. **Viewport Consistency**: Tests maintain a consistent viewport (1199x1003)
4. **Error Handling**: Tests gracefully handle missing data scenarios
5. **Tab Navigation**: Tests validate application navigation between tabs

## Extending Tests

When adding new tests:

1. Consider adding common actions to `commands.ts`
2. Follow the established pattern for conditional testing
3. Ensure tests are isolated and don't rely on state from previous tests
4. Use descriptive test names and comments

## Related Configuration

- Configuration for these tests can be found in `cypress.config.ts`
- Global TypeScript definitions are in `cypress/support/e2e.ts`
