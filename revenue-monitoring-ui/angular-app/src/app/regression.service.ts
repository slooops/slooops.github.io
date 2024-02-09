import { Injectable } from '@angular/core';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';

@Injectable({
  providedIn: 'root',
})
export class RegressionService {
  constructor() {}

  performLinearRegression(
    x: number[],
    y: number[]
  ): { slope: number; intercept: number } {
    // Ensure that x and y are of the same length
    if (x.length !== y.length) {
      throw new Error('The arrays x and y must be of the same length');
    }

    // Perform the linear regression
    const regression = new SimpleLinearRegression(x, y);

    // Return the slope and intercept
    return {
      slope: regression.slope,
      intercept: regression.intercept,
    };
  }
}
