import exp from 'constants';

describe('Accounts Test Demo', () => {
  it('Tests accounts page', () => {
    cy.viewport(1199, 1003);
    cy.visit('http://localhost:4200/accounts');

    // Perform common process flow steps on Pre-Invoicing tab
    cy.testProcessFlowAndAssignment();

    // cy.get(':nth-child(3) > .cdk-column-TRANSACTION_ID');
    //get the 3rd row of the table, copy it, and log it, then paste it into the input field
    cy.get(':nth-child(3) > .cdk-column-TRANSACTION_ID')
      .invoke('text')
      .then((transactionId) => {
        cy.log('🔎 Copied Transaction ID: ' + transactionId);

        cy.get(
          ':nth-child(4) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix'
        )
          .should('exist')
          .type(transactionId.trim());
      });

    //clear the input fields
    cy.get('.form-container > .mat-focus-indicator')
      .should('be.visible')
      .click();

    //this is the stuff that works
    //test the subref filter

    cy.get(':nth-child(3) > .cdk-column-SUBREF-ORDER-NUMBER')
      .invoke('text')
      .then((subrefText) => {
        const cleanSubref = subrefText
          .replace(/\u00a0/g, ' ')
          .match(/\d+/)?.[0];
        cy.log('🔎 Copied subref ID: ' + cleanSubref);

        cy.get(
          ':nth-child(3) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix input'
        )
          .should('exist')
          .clear()
          .type(cleanSubref);

        cy.get(':nth-child(1) > .cdk-column-SUBREF-ORDER-NUMBER')
          .invoke('text')
          .then((filteredSubref) => {
            const cleanFiltered = filteredSubref
              .replace(/\u00a0/g, ' ')
              .match(/\d+/)?.[0];
            cy.log('🔎 First visible subref: ' + cleanFiltered);
            expect(cleanFiltered).to.equal(cleanSubref);
          });
      });

    //clear the input fields
    cy.get('.form-container > .mat-focus-indicator')
      .should('be.visible')
      .click();

    //the above code works, but has no handlers
    //this is garbage below from copilot, we need to test it again

    cy.get(':nth-child(3) >.cdk-column-SUBREF-ORDER-NUMBER').then((cells) => {
      if (cells.length < 3) {
        cy.log('⚠️ Not enough rows in the SUBREF column to run the test.');
        console.warn(
          '⚠️ Not enough rows in the SUBREF column to run the test.'
        );
        return;
      }
      const rawSubrefText = cells[2].innerText || '';
      const cleanSubref = rawSubrefText

        .replace(/\u00a0/g, ' ')
        .match(/\d+/)?.[0];
      if (!cleanSubref) {
        cy.log('⚠️ Could not extract a numeric subref from the 3rd row.');
        console.warn('⚠️ Could not extract a numeric subref from the 3rd row.');
        return;
      }
      cy.log(`🔎 Copied subref ID: ${cleanSubref}`);
      console.log(`🔎 Copied subref ID: ${cleanSubref}`);
      // Paste into the filter
      cy.get(
        ':nth-child(3) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix input'
      )
        .should('exist')
        .clear()
        .type(cleanSubref);
      // Wait a little in case there's debounce or animation delay
      cy.wait(500);
      // Check that a result showed up
      cy.get('.cdk-column-SUBREF-ORDER-NUMBER').then((filteredCells) => {
        if (filteredCells.length === 0) {
          throw new Error(
            '❌ Filter did not return any results for a valid input.'
          );
        }
        const filteredRaw = filteredCells[0].innerText || '';
        const cleanFiltered = filteredRaw
          .replace(/\u00a0/g, ' ')
          .match(/\d+/)?.[0];
        if (cleanFiltered !== cleanSubref) {
          throw new Error(
            `❌ Filtered result "${cleanFiltered}" does not match expected "${cleanSubref}".`
          );
        }
        cy.log(`✅ Filter working: "${cleanFiltered}" matched.`);
        console.log(`✅ Filter working: "${cleanFiltered}" matched.`);
      });
    });

    cy.get(' :nth-child(3) > .cdk-column-SUBREF-ORDER-NUMBER').then((cells) => {
      if (cells.length < 3) {
        cy.log('⚠️ Not enough rows in the SUBREF column to run the test.');
        console.warn(
          '⚠️ Not enough rows in the SUBREF column to run the test.'
        );
        return;
      }

      const rawSubrefText = cells[2].innerText || '';
      const cleanSubref = rawSubrefText
        .replace(/\u00a0/g, ' ')
        .match(/\d+/)?.[0];

      if (!cleanSubref) {
        cy.log('⚠️ Could not extract a numeric subref from the 3rd row.');
        console.warn('⚠️ Could not extract a numeric subref from the 3rd row.');
        return;
      }

      cy.log(`🔎 Copied subref ID: ${cleanSubref}`);
      console.log(`🔎 Copied subref ID: ${cleanSubref}`);

      // Paste into the filter
      cy.get(
        ':nth-child(3) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix input'
      )
        .should('exist')
        .clear()
        .type(cleanSubref);

      // Wait a little in case there's debounce or animation delay
      cy.wait(500);

      // Check that a result showed up
      cy.get('.cdk-column-SUBREF-ORDER-NUMBER').then((filteredCells) => {
        if (filteredCells.length === 0) {
          throw new Error(
            '❌ Filter did not return any results for a valid input.'
          );
        }

        const filteredRaw = filteredCells[0].innerText || '';
        const cleanFiltered = filteredRaw
          .replace(/\u00a0/g, ' ')
          .match(/\d+/)?.[0];

        if (cleanFiltered !== cleanSubref) {
          throw new Error(
            `❌ Filtered result "${cleanFiltered}" does not match expected "${cleanSubref}".`
          );
        }

        cy.log(`✅ Filter working: "${cleanFiltered}" matched.`);
        console.log(`✅ Filter working: "${cleanFiltered}" matched.`);
      });
    });

    // cy.get(':nth-child(3) > .cdk-column-SUBREF-ORDER-NUMBER')
    //   .invoke('text')
    //   .then((subref) => {
    //     cy.log('🔎 Copied subref ID: ' + subref);

    //     cy.get(
    //       ':nth-child(3) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix'
    //     )
    //       .should('exist')
    //       .type(subref.trim());
    //   });

    // Step 2: Assert that the first row now contains the value
    // cy.get(':nth-child(1) > .cdk-column-SUBREF-ORDER-NUMBER')
    //     .invoke('text')
    //     .then((subrefFiltered) => {
    //     cy.log('🔎 Copied subref ID: ' + subrefFiltered);
    //     expect(subrefFiltered).to.equal(subref);

    // cy.get('.form-container > .mat-focus-indicator')
    //   .should('be.visible')
    //   .click();

    // cy.get('.cdk-column-SUBREF-ORDER-NUMBER').then((cells) => {
    //   if (cells.length < 3) {
    //     cy.log('⚠️ Not enough rows in the SUBREF column to run the test.');
    //     console.warn(
    //       '⚠️ Not enough rows in the SUBREF column to run the test.'
    //     );
    //     return;
    //   }

    //   const rawSubrefText = cells[2].innerText || '';
    //   const cleanSubref = rawSubrefText
    //     .replace(/\u00a0/g, ' ')
    //     .match(/\d+/)?.[0];

    //   if (!cleanSubref) {
    //     cy.log('⚠️ Could not extract a numeric subref from the 3rd row.');
    //     console.warn('⚠️ Could not extract a numeric subref from the 3rd row.');
    //     return;
    //   }

    //   cy.log(`🔎 Copied subref ID: ${cleanSubref}`);
    //   console.log(`🔎 Copied subref ID: ${cleanSubref}`);

    //   // Paste into the filter
    //   cy.get(
    //     ':nth-child(3) > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix input'
    //   )
    //     .should('exist')
    //     .clear()
    //     .type(cleanSubref);

    //   // Wait a little in case there's debounce or animation delay
    //   cy.wait(500);

    //   // Check that a result showed up
    //   cy.get('.cdk-column-SUBREF-ORDER-NUMBER').then((filteredCells) => {
    //     if (filteredCells.length === 0) {
    //       throw new Error(
    //         '❌ Filter did not return any results for a valid input.'
    //       );
    //     }

    //     const filteredRaw = filteredCells[0].innerText || '';
    //     const cleanFiltered = filteredRaw
    //       .replace(/\u00a0/g, ' ')
    //       .match(/\d+/)?.[0];

    //     if (cleanFiltered !== cleanSubref) {
    //       throw new Error(
    //         `❌ Filtered result "${cleanFiltered}" does not match expected "${cleanSubref}".`
    //       );
    //     }

    //     cy.log(`✅ Filter working: "${cleanFiltered}" matched.`);
    //     console.log(`✅ Filter working: "${cleanFiltered}" matched.`);
    //   });
    // });
  });
});

// describe('Demo 2', () => {
//   it('Searches for a Transaction ID using the 3rd row value', () => {
//     cy.viewport(1199, 1003);
//     cy.visit('http://localhost:4200/accounts');

//     // Step 1: Wait for table to load and grab transaction IDs
//     cy.get('.cdk-column-TRANSACTION_ID').then((rows) => {
//       if (rows.length >= 3) {
//         const thirdValue = rows[2].innerText.trim();
//         cy.log(`🔎 Copied Transaction ID: ${thirdValue}`);
//         console.log(`🔎 Copied Transaction ID: ${thirdValue}`);

//         // Step 2: Find the input with placeholder "Search Transaction ID"
//         cy.get('input[placeholder="Search Transaction ID"]')
//           .should('exist')
//           .clear()
//           .type(thirdValue);

//         // Step 3: Assert that the first row now contains the value
//         cy.get('.cdk-column-TRANSACTION_ID')
//           .first()
//           .invoke('text')
//           .then((firstText) => {
//             expect(firstText.trim()).to.equal(thirdValue);
//             cy.log(`✅ Top row matches searched value: ${firstText.trim()}`);
//           });
//       } else {
//         cy.log(
//           '⚠️ Not enough rows in the Transaction ID column to run the test.'
//         );
//         console.warn(
//           '⚠️ Not enough rows in the Transaction ID column to run the test.'
//         );
//       }
//     });
//   });
// });
