import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import pino from "pino";
import { LEARN_TICKERS } from "../constants.js";
import { fitPlattScaling } from "../optimization/calibrator.js";
import { calculateMetrics, matchPredictions } from "../optimization/evaluator.js";
import { Optimizer } from "../optimization/optimizer.js";
import type { PredictionRecord } from "../types/index.js";
import { saveOptimizedConfig } from "../utils/config-loader.js";
import { predictCommand } from "./predict.js";

const logger = pino({ name: "learn" });

/**
 * Full learning/self-improvement loop:
 * 1. Run predictions on key Indian tickers
 * 2. Load all saved predictions
 * 3. Match predictions with actual outcomes from historical CSVs
 * 4. Calculate accuracy metrics
 * 5. Calibrate probability model (Platt scaling)
 * 6. Optimize weights via backtesting
 * 7. Save optimized configuration
 */
export async function learnCommand(): Promise<void> {
	console.log("\n🧠 Starting learning loop...\n");

	// Step 1: Run fresh predictions
	console.log("Step 1/6: Running predictions on key tickers...");
	await predictCommand({
		tickers: LEARN_TICKERS,
		sort: "desc",
		format: "csv",
	});

	// Step 2: Load all saved predictions
	console.log("\nStep 2/6: Loading prediction history...");
	const predictions = loadAllPredictions();
	console.log(`  Found ${predictions.length} historical predictions`);

	if (predictions.length === 0) {
		console.log("  No prediction history found. Run predictions for a few days first.");
		console.log("  Learning loop will improve with more data over time.");
	}

	// Step 3: Load historical data and match predictions
	console.log("\nStep 3/6: Matching predictions with outcomes...");
	const historicalData = loadHistoricalCsvData();
	console.log(`  Loaded ${historicalData.length} historical data points`);

	const matched = matchPredictions(predictions, historicalData);
	console.log(`  Matched ${matched.length} predictions with outcomes`);

	// Step 4: Calculate metrics
	console.log("\nStep 4/6: Calculating accuracy metrics...");
	const metrics = calculateMetrics(matched);
	console.log(`  Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
	console.log(`  Precision: ${(metrics.precision * 100).toFixed(1)}%`);
	console.log(`  Recall: ${(metrics.recall * 100).toFixed(1)}%`);
	console.log(`  F1 Score: ${(metrics.f1Score * 100).toFixed(1)}%`);
	console.log(`  Total: ${metrics.totalPredictions} | Correct: ${metrics.correctPredictions}`);

	// Step 5: Calibrate probabilities
	console.log("\nStep 5/6: Calibrating probability model...");
	const calibration = fitPlattScaling(matched);
	console.log(`  Slope: ${calibration.slope.toFixed(4)}`);
	console.log(`  Intercept: ${calibration.intercept.toFixed(4)}`);
	console.log(`  Brier Score: ${calibration.brierScore.toFixed(4)}`);

	// Step 6: Optimize weights (run on 3 key tickers, take best)
	console.log("\nStep 6/6: Optimizing indicator weights...");
	const optimizeSymbols = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"];
	let bestResult: any = null;

	for (const symbol of optimizeSymbols) {
		try {
			console.log(`  Optimizing for ${symbol}...`);
			const optimizer = new Optimizer();
			const result = await optimizer.optimize(symbol, 100);

			if (!bestResult || result.bestValue > bestResult.bestValue) {
				bestResult = result;
			}

			console.log(
				`    Sharpe: ${result.metrics.sharpeRatio.toFixed(2)} | DD: ${result.metrics.maxDrawdown.toFixed(1)}% | WR: ${result.metrics.winRate.toFixed(1)}%`,
			);
		} catch (error) {
			logger.warn({ symbol, error }, "Optimization failed for symbol");
		}
	}

	// Save best configuration
	if (bestResult) {
		saveOptimizedConfig({
			symbol: bestResult.symbol,
			indicatorWeights: bestResult.bestParams.indicatorWeights,
			patternWeights: bestResult.bestParams.patternWeights,
			thresholds: bestResult.bestParams.thresholds,
			calibration: {
				slope: calibration.slope,
				intercept: calibration.intercept,
			},
			metrics: {
				sharpeRatio: bestResult.metrics.sharpeRatio,
				maxDrawdown: bestResult.metrics.maxDrawdown,
				winRate: bestResult.metrics.winRate,
				return: bestResult.metrics.return,
			},
		});

		console.log("\n✅ Learning loop complete!");
		console.log(`   Best optimization from: ${bestResult.symbol}`);
		console.log(`   Config saved to: data/config/optimized_weights.json`);
	} else {
		console.log("\n⚠️ No optimization results. Check data availability.");
	}
}

/**
 * Load all prediction records from data/feedback/ directory.
 */
function loadAllPredictions(): PredictionRecord[] {
	const dir = "data/feedback";
	if (!existsSync(dir)) return [];

	const files = readdirSync(dir).filter((f) => f.startsWith("predictions_") && f.endsWith(".json"));
	const allPredictions: PredictionRecord[] = [];

	for (const file of files) {
		try {
			const raw = readFileSync(`${dir}/${file}`, "utf-8");
			const records: PredictionRecord[] = JSON.parse(raw);
			allPredictions.push(...records);
		} catch (error) {
			logger.warn({ file, error }, "Failed to load prediction file");
		}
	}

	return allPredictions;
}

/**
 * Load historical CSV data from public/ directory.
 */
function loadHistoricalCsvData(): Array<{
	date: string;
	ticker: string;
	close: number;
}> {
	const dir = "public";
	if (!existsSync(dir)) return [];

	const files = readdirSync(dir).filter(
		(f) => f.startsWith("stock_data_") && f.endsWith(".csv"),
	);
	const data: Array<{ date: string; ticker: string; close: number }> = [];

	for (const file of files) {
		try {
			const raw = readFileSync(`${dir}/${file}`, "utf-8");
			const records = parse(raw, {
				columns: true,
				skip_empty_lines: true,
			}) as any[];

			for (const record of records) {
				data.push({
					date: record.Date,
					ticker: record.Ticker,
					close: Number.parseFloat(record.Close),
				});
			}
		} catch (error) {
			logger.warn({ file, error }, "Failed to load CSV file");
		}
	}

	return data;
}
