import pino from "pino";
import type { AccuracyMetrics, MatchedPrediction, PredictionRecord } from "../types/index.js";

const logger = pino({ name: "evaluator" });

interface HistoricalRow {
	date: string;
	ticker: string;
	close: number;
}

/**
 * Match predictions with future outcomes.
 * Looks for price 5+ days forward:
 * - BUY is correct if price rose ≥ 2%
 * - SELL is correct if price fell ≥ 2%
 * - HOLD is correct if price stayed within ±2%
 */
export function matchPredictions(
	predictions: PredictionRecord[],
	historicalData: HistoricalRow[],
	lookForwardDays = 5,
): MatchedPrediction[] {
	const matched: MatchedPrediction[] = [];

	// Build lookup by ticker+date
	const dataByTickerDate = new Map<string, number>();
	for (const row of historicalData) {
		dataByTickerDate.set(`${row.ticker}_${row.date}`, row.close);
	}

	for (const pred of predictions) {
		// Find future price (at least lookForwardDays ahead)
		const predDate = new Date(pred.date);
		let futurePrice: number | null = null;
		let outcomeDate = "";

		for (let d = lookForwardDays; d <= lookForwardDays + 10; d++) {
			const futureDate = new Date(predDate);
			futureDate.setDate(futureDate.getDate() + d);
			const futureDateStr = futureDate.toISOString().split("T")[0];
			const key = `${pred.ticker}_${futureDateStr}`;

			if (dataByTickerDate.has(key)) {
				futurePrice = dataByTickerDate.get(key)!;
				outcomeDate = futureDateStr;
				break;
			}
		}

		if (futurePrice === null) continue;

		const change = (futurePrice - pred.close) / pred.close;
		let isCorrect = false;

		if (pred.opinion === "BUY" && change >= 0.02) isCorrect = true;
		else if (pred.opinion === "SELL" && change <= -0.02) isCorrect = true;
		else if (pred.opinion === "HOLD" && Math.abs(change) < 0.02) isCorrect = true;

		matched.push({
			...pred,
			futurePrice,
			outcomeDate,
			change,
			isCorrect,
		});
	}

	logger.info(
		{ total: predictions.length, matched: matched.length },
		"Predictions matched with outcomes",
	);

	return matched;
}

/**
 * Calculate accuracy metrics from matched predictions.
 */
export function calculateMetrics(
	matched: MatchedPrediction[],
): AccuracyMetrics {
	if (matched.length === 0) {
		return {
			hitRate: 0,
			precision: 0,
			recall: 0,
			f1Score: 0,
			totalPredictions: 0,
			correctPredictions: 0,
		};
	}

	const correctPredictions = matched.filter((m) => m.isCorrect).length;
	const hitRate = correctPredictions / matched.length;

	// Precision: of all BUY/SELL predictions, how many were correct?
	const actionPredictions = matched.filter(
		(m) => m.opinion === "BUY" || m.opinion === "SELL",
	);
	const correctActions = actionPredictions.filter((m) => m.isCorrect).length;
	const precision = actionPredictions.length > 0
		? correctActions / actionPredictions.length
		: 0;

	// Recall: of all actual moves, how many did we predict?
	const actualMoves = matched.filter((m) => Math.abs(m.change) >= 0.02);
	const predictedMoves = actualMoves.filter(
		(m) => m.opinion === "BUY" || m.opinion === "SELL",
	);
	const recall = actualMoves.length > 0
		? predictedMoves.length / actualMoves.length
		: 0;

	const f1Score =
		precision + recall > 0
			? (2 * precision * recall) / (precision + recall)
			: 0;

	logger.info(
		{
			hitRate: (hitRate * 100).toFixed(1),
			precision: (precision * 100).toFixed(1),
			recall: (recall * 100).toFixed(1),
			f1Score: (f1Score * 100).toFixed(1),
		},
		"Accuracy metrics calculated",
	);

	return {
		hitRate,
		precision,
		recall,
		f1Score,
		totalPredictions: matched.length,
		correctPredictions,
	};
}
