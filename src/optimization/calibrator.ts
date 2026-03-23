import pino from "pino";
import type { CalibrationResult, MatchedPrediction } from "../types/index.js";

const logger = pino({ name: "calibrator" });

/**
 * Fit Platt Scaling parameters using grid search to minimize Brier score.
 * Calibrates the sigmoid transformation from raw scores to probabilities.
 */
export function fitPlattScaling(
	predictions: MatchedPrediction[],
): CalibrationResult {
	if (predictions.length === 0) {
		return { slope: 0.01, intercept: -1.0, brierScore: 1.0 };
	}

	let bestSlope = 0.01;
	let bestIntercept = -1.0;
	let bestBrier = Infinity;

	// Grid search: 4 slopes × 5 intercepts = 20 combinations
	const slopes = [0.005, 0.01, 0.015, 0.02];
	const intercepts = [-2.0, -1.5, -1.0, -0.5, 0.0];

	for (const slope of slopes) {
		for (const intercept of intercepts) {
			let brierSum = 0;

			for (const pred of predictions) {
				const predicted = sigmoid(pred.score, slope, intercept);
				const actual = pred.isCorrect ? 1 : 0;
				brierSum += (predicted - actual) ** 2;
			}

			const brierScore = brierSum / predictions.length;

			if (brierScore < bestBrier) {
				bestBrier = brierScore;
				bestSlope = slope;
				bestIntercept = intercept;
			}
		}
	}

	logger.info(
		{ slope: bestSlope, intercept: bestIntercept, brierScore: bestBrier },
		"Platt scaling calibrated",
	);

	return {
		slope: bestSlope,
		intercept: bestIntercept,
		brierScore: bestBrier,
	};
}

function sigmoid(score: number, slope: number, intercept: number): number {
	return 1 / (1 + Math.exp(-(slope * score + intercept)));
}
