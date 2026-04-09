import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ExceptionDetail {
  id: string;
  title: string;
  status: string;
  statusClass: string;
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  errorDetail: string;
  stackTraceHidden: number;
  botModelVersion: string;
  botAnalysis: string;
  duplicateHighlight: string;
  recommendedSql: string;
  confidence: string;
  confidencePercent: number;
  successRate: string;
  successRateLabel: string;
}

@Component({
  selector: 'app-exception-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exception-details.component.html',
  styleUrls: ['./exception-details.component.css'],
})
export class ExceptionDetailsComponent {
  @Input() exceptionId: string = '';
  @Input() backLabel: string = 'Back to Queue';
  @Output() back = new EventEmitter<void>();

  activeTab: 'review' | 'trace' = 'review';
  accuracyAssessment: 'correct' | 'incorrect' | null = 'correct';
  qualityScore = 4;
  reviewerNotes = '';

  exception: ExceptionDetail = {
    id: '#EXC-2024-00847',
    title: 'Database Integrity Violation',
    status: 'AWAITING_APPROVAL',
    statusClass: 'status--awaiting',
    timestamp: '2024-10-24 14:22:01.442',
    errorCode: 'ORA-00001: unique constraint (PROD.I2C_TXN_PK) violated',
    errorMessage:
      "Error at line 1, column 15: INSERT INTO PROD.I2C_TRANSACTIONS (TXN_ID, AMOUNT, CURRENCY) VALUES ('TXN_9921', 450.00, 'USD')",
    errorDetail: 'Stack Trace Hidden (14 more lines...)',
    stackTraceHidden: 14,
    botModelVersion: 'v4.2.1-Core',
    botAnalysis:
      'The bot detected a race condition during the transaction batching process. The transaction ID',
    duplicateHighlight: 'duplication conflict',
    recommendedSql: `UPDATE PROD.I2C_TRANSACTIONS
SET RETRY_FLAG = 'Y',
    ORIGINAL_NODE = 'NODE_07'
WHERE TXN_ID = 'TXN_9921'
  AND STATUS = 'PENDING';`,
    confidence: 'HIGH',
    confidencePercent: 92,
    successRate: '98%',
    successRateLabel: 'Historical Accuracy',
  };

  get starArray(): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < this.qualityScore);
  }

  setQualityScore(score: number): void {
    this.qualityScore = score;
  }

  setAssessment(value: 'correct' | 'incorrect'): void {
    this.accuracyAssessment = value;
  }

  goBack(): void {
    this.back.emit();
  }

  saveReview(): void {
    // placeholder
  }
}
