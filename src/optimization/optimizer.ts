import pino from "pino";
import { Backtester } from "./backtester.js";
import { DataLoader } from "./data-loader.js";
import type { OptimizationParams, OptimizationResult } from "./types.js";

const logger = pino({ name: "optimizer" });

/**
 * Random search optimizer for Indian stock market parameters.
 * Tunes indicator weights, pattern weights, thresholds, and calibration parameters.
 */
export class Optimizer {
	private dataLoader = new DataLoader();
	private backtester = new Backtester();

	/**
	 * Run optimization with random search.
	 * @param symbol - Ticker symbol (e.g., RELIANCE.NS)
	 * @param nTrials - Number of random parameter combinations to try
	 */
	async optimize(
		symbol: string,
		nTrials = 200,
	): Promise<OptimizationResult> {
		logger.info({ symbol, nTrials }, "Starting optimization");

		const data = await this.dataLoader.loadHistoricalData(symbol, 730);

		if (data.length < 200) {
			throw new Error(
				`Insufficient data for ${symbol}: ${data.length} bars (need ≥200)`,
			);
		}

		let bestValue = -Infinity;
		let bestParams: OptimizationParams | null = null;
		let bestMetrics = {
			sharpeRatio: 0,
			maxDrawdown: 100,
			winRate: 0,
			totalTrades: 0,
			profitFactor: 0,
			return: -100,
		};

		for (let trial = 0; trial < nTrials; trial++) {
			const params = this.generateRandomParams();
			const metrics = this.backtester.run(data, params);

			// Objective: maximize Sharpe ratio while penalizing drawdown
			// Discard if max drawdown > 30%
			let value: number;
			if (metrics.maxDrawdown > 30) {
				value = -Infinity;
			} else {
				value = metrics.sharpeRatio * 0.7 - (metrics.maxDrawdown / 100) * 0.3;
			}

			if (value > bestValue) {
				bestValue = value;
				bestParams = params;
				bestMetrics = metrics;

				if (trial % 50 === 0) {
					logger.info(
						{
							trial,
							value: value.toFixed(3),
							sharpe: metrics.sharpeRatio.toFixed(2),
							drawdown: metrics.maxDrawdown.toFixed(1),
						},
						"New best found",
					);
				}
			}
		}

		if (!bestParams) {
			throw new Error(`No valid parameters found for ${symbol} after ${nTrials} trials`);
		}

		logger.info(
			{
				symbol,
				bestValue: bestValue.toFixed(3),
				sharpe: bestMetrics.sharpeRatio.toFixed(2),
				drawdown: bestMetrics.maxDrawdown.toFixed(1),
				winRate: bestMetrics.winRate.toFixed(1),
				return: bestMetrics.return.toFixed(1),
			},
			"Optimization complete",
		);

		return {
			strategy: "random-search",
			symbol,
			bestValue,
			bestParams,
			nTrials,
			metrics: bestMetrics,
		};
	}

	/**
	 * Generate random parameters within valid ranges.
	 */
	private generateRandomParams(): OptimizationParams {
		return {
			indicatorWeights: {
				rsi: randRange(50, 100),
				stochastic: randRange(50, 100),
				bollinger: randRange(50, 100),
				donchian: randRange(50, 100),
				williamsR: randRange(50, 100),
				indiaVix: randRange(30, 80),
				macd: randRange(50, 100),
				sma: randRange(40, 80),
				ema: randRange(40, 80),
			},
			patternWeights: {
				ascendingTriangle: randRange(50, 100),
				bullishFlag: randRange(50, 100),
				doubleBottom: randRange(50, 100),
				fallingWedge: randRange(50, 100),
				islandReversal: randRange(50, 100),
			},
			thresholds: {
				buy: randInt(150, 250),
				sell: randInt(150, 250),
			},
			calibration: {
				slope: randRange(0.005, 0.02),
				intercept: randRange(-2.0, 0.0),
			},
		};
	}
}

function randRange(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
