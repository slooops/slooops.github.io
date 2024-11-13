import { Component } from '@angular/core';

@Component({
  selector: 'app-o2c-demo',
  templateUrl: './o2c-demo.component.html',
  styleUrl: './o2c-demo.component.css',
})
export class O2cDemoComponent {
  accrualsTotals: { [key: string]: number } = {
    KAFKA_INBOUND_ERROR: 0,
    KAFKA_INBOUND: 0,
    ACCRUAL_LINEEXTN_BILLS_AHEAD_OF_TSV: 64.08,
    ACCRUAL_PROCESS: 0,
    ACCRUAL_DIST: 0,
    ACCRUAL_SUMMARY: 0,
    ACCRUAL_SUMM_DIST: 0,
    KAFKA_PUBLISH: 0,
    GL_BATCH_RECON: 0,
  };

  // Define the steps array in a way that doesn’t modify the original `accrualsTotals`
  skippedWords: string[] = ['IOL', 'AR', 'ID', 'GL', 'TSV'];

  formattedAccrualsSteps = Object.keys(this.accrualsTotals).map((key) => ({
    label: this.formatLabel(key),
    impact: this.accrualsTotals[key] || 'N/A',
  }));

  // Function to format the label
  formatLabel(label: string): string {
    return label
      .toLowerCase() // Convert to lowercase
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split into words
      .map(
        (word) =>
          this.skippedWords.includes(word.toUpperCase())
            ? word.toUpperCase() // Keep the word in uppercase if it's in skippedWords
            : word.charAt(0).toUpperCase() + word.slice(1) // Capitalize the first letter otherwise
      )
      .join(' '); // Join words back with spaces
  }
}
