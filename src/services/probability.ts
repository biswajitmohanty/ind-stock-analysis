import { DEFAULT_CALIBRATION } from "../constants.js";
import type { ProbabilityResult } from "../types/index.js";

/**
 * Convert raw BUY/SELL scores to calibrated probabilities using Platt Scaling.
 * P(x) = sigmoid(score, slope, intercept) = 1 / (1 + exp(-(slope * score + intercept)))
 */
export function calculateProbabilities(
	buyScore: number,
	sellScore: number,
	calibration: { slope: number; intercept: number } = DEFAULT_CALIBRATION,
): ProbabilityResult {
	const { slope, intercept } = calibration;

	const rawBuy = sigmoid(buyScore, slope, intercept);
	const rawSell = sigmoid(sellScore, slope, intercept);
	const rawHold = Math.max(0, 1 - rawBuy - rawSell);

	// Normalize to sum to 100%
	const total = rawBuy + rawSell + rawHold;
	const buyProbability = Math.round((rawBuy / total) * 10000) / 100;
	const sellProbability = Math.round((rawSell / total) * 10000) / 100;
	const holdProbability = Math.round((rawHold / total) * 10000) / 100;

	// Confidence level based on max probability
	const maxProb = Math.max(buyProbability, sellProbability);
	let confidence: string;
	if (maxProb >= 75) confidence = "very-high";
	else if (maxProb >= 60) confidence = "high";
	else if (maxProb >= 40) confidence = "medium";
	else confidence = "low";

	return { buyProbability, sellProbability, holdProbability, confidence };
}

function sigmoid(score: number, slope: number, intercept: number): number {
	return 1 / (1 + Math.exp(-(slope * score + intercept)));
}
