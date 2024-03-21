import { Injectable } from '@angular/core';
import MLR from 'ml-regression-multivariate-linear';

@Injectable({
  providedIn: 'root',
})
export class RegressionService {
  private model: MLR | null = null; // Store the model instance here

  constructor() {}

  performMultipleLinearRegression(
    X: number[][],
    y: number[][]
  ): {
    coefficients: number[];
    intercept: number;
    lowerCI: number;
    upperCI: number;
  } {
    const regression = new MLR(X, y, { intercept: true });
    this.model = regression; // Store the trained model for later use in prediction

    // Assuming the last element of the weights array is the intercept
    const intercept = regression.weights[regression.weights.length - 1][0];

    // All other elements before the last are coefficients
    const coefficients = regression.weights
      .slice(0, -1)
      .map((weight) => weight[0]);

    const stdError = regression.stdError;

    const modelIntercept = regression.weights[2][0]; // this is the intercept
    const degreesOfFreedom = y.length - 2; // n (observations) - p (product & service)
    console.log('Degrees of Freedom =', degreesOfFreedom);
    const criticalValue = this.getCriticalValue(degreesOfFreedom);

    const lowerConfidenceInterval = modelIntercept - criticalValue * stdError;
    const upperConfidenceInterval = modelIntercept + criticalValue * stdError;

    // console.log('Standard Error =', regression.stdError);
    // console.log('Model Intercept =', modelIntercept);
    // console.log('Lower Confidence Interval =', lowerConfidenceInterval);
    // console.log('Upper Confidence Interval =', upperConfidenceInterval);

    return {
      coefficients: coefficients,
      intercept: intercept,
      lowerCI: lowerConfidenceInterval,
      upperCI: upperConfidenceInterval,
    };
  }

  predict(X: number[][]): number[] {
    if (!this.model) {
      throw new Error(
        'Model not set. Please train the model before predicting.'
      );
    }
    return this.model.predict(X).map((result) => result[0]);
  }

  predictWithConfidenceIntervals(
    X: number[][],
    degreesOfFreedom: number
  ): {
    predictedRuntime: number;
    lowerCI: number;
    upperCI: number;
  } {
    if (!this.model) {
      throw new Error(
        'Model not set. Please train the model before predicting.'
      );
    }

    const predictedRuntime = this.model.predict(X)[0][0];
    const stdError = this.model.stdError;
    // Use the provided degrees of freedom to get the critical value
    const criticalValue = this.getCriticalValue(degreesOfFreedom);

    const lowerCI = predictedRuntime - criticalValue * stdError;
    const upperCI = predictedRuntime + criticalValue * stdError;

    return { predictedRuntime, lowerCI, upperCI };
  }

  getCriticalValue(degreesOfFreedom: number): number {
    const criticalValueKey =
      degreesOfFreedom <= 100 ? degreesOfFreedom.toString() : '100';
    const criticalValue = criticalValuesJSON[criticalValueKey];

    if (criticalValue === undefined) {
      throw new Error(
        `Critical value not found for ${degreesOfFreedom} degrees of freedom.`
      );
    }

    return criticalValue;
  }
}

const criticalValuesJSON = {
  '1': 12.706,
  '2': 4.303,
  '3': 3.182,
  '4': 2.776,
  '5': 2.571,
  '6': 2.447,
  '7': 2.365,
  '8': 2.306,
  '9': 2.262,
  '10': 2.228,
  '11': 2.201,
  '12': 2.179,
  '13': 2.16,
  '14': 2.145,
  '15': 2.131,
  '16': 2.12,
  '17': 2.11,
  '18': 2.101,
  '19': 2.093,
  '20': 2.086,
  '21': 2.08,
  '22': 2.074,
  '23': 2.069,
  '24': 2.064,
  '25': 2.06,
  '26': 2.056,
  '27': 2.052,
  '28': 2.048,
  '29': 2.045,
  '30': 2.042,
  '31': 2.04,
  '32': 2.037,
  '33': 2.035,
  '34': 2.032,
  '35': 2.03,
  '36': 2.028,
  '37': 2.026,
  '38': 2.024,
  '39': 2.023,
  '40': 2.021,
  '41': 2.02,
  '42': 2.018,
  '43': 2.017,
  '44': 2.015,
  '45': 2.014,
  '46': 2.013,
  '47': 2.012,
  '48': 2.011,
  '49': 2.01,
  '50': 2.009,
  '51': 2.008,
  '52': 2.007,
  '53': 2.006,
  '54': 2.005,
  '55': 2.004,
  '56': 2.003,
  '57': 2.002,
  '58': 2.002,
  '59': 2.001,
  '60': 2.0,
  '61': 2.0,
  '62': 1.999,
  '63': 1.998,
  '64': 1.998,
  '65': 1.997,
  '66': 1.997,
  '67': 1.996,
  '68': 1.995,
  '69': 1.995,
  '70': 1.994,
  '71': 1.994,
  '72': 1.993,
  '73': 1.993,
  '74': 1.993,
  '75': 1.992,
  '76': 1.992,
  '77': 1.991,
  '78': 1.991,
  '79': 1.99,
  '80': 1.99,
  '81': 1.99,
  '82': 1.989,
  '83': 1.989,
  '84': 1.989,
  '85': 1.988,
  '86': 1.988,
  '87': 1.988,
  '88': 1.987,
  '89': 1.987,
  '90': 1.987,
  '91': 1.986,
  '92': 1.986,
  '93': 1.986,
  '94': 1.986,
  '95': 1.985,
  '96': 1.985,
  '97': 1.985,
  '98': 1.984,
  '99': 1.984,
  '100': 1.96,
};
