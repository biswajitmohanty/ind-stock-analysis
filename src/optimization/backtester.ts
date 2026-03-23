import pino from "pino";
import {
	INDIA_VIX_HIGH_THRESHOLD,
	INDIA_VIX_LOW_THRESHOLD,
	TRANSACTION_COST_PERCENT,
} from "../constants.js";
import { calculateAllIndicators } from "../services/indicators.js";
import { detectPatterns } from "../services/patterns.js";
import type { HistoricalPrice, PatternWeights } from "../types/index.js";
import type { BacktestMetrics, OptimizationParams } from "./types.js";

const logger = pino({ name: "backtester" });

/**
 * Backtester for Indian stock market.
 * Includes Indian-specific transaction costs (STT + brokerage + stamp duty).
 */
export class Backtester {
	/**
	 * Run a backtest with given parameters on historical data.
	 */
	run(data: HistoricalPrice[], params: OptimizationParams): BacktestMetrics {
		if (data.length < 200) {
			return {
				sharpeRatio: -Infinity,
				maxDrawdown: 100,
				winRate: 0,
				totalTrades: 0,
				profitFactor: 0,
				return: -100,
			};
		}

		const closes = data.map((d) => d.close);
		const highs = data.map((d) => d.high);
		const lows = data.map((d) => d.low);

		// Generate signals
		const signals = this.generateSignals(closes, highs, lows, params);

		// Simulate trades with Indian transaction costs
		return this.simulateTrades(closes, signals);
	}

	private generateSignals(
		closes: number[],
		highs: number[],
		lows: number[],
		params: OptimizationParams,
	): string[] {
		const signals: string[] = [];
		const { indicatorWeights, patternWeights, thresholds } = params;

		// Build full pattern weights (add bearish mirrors)
		const fullPatternWeights: PatternWeights = {
			ascendingTriangle: patternWeights.ascendingTriangle,
			bullishFlag: patternWeights.bullishFlag,
			doubleBottom: patternWeights.doubleBottom,
			fallingWedge: patternWeights.fallingWedge,
			islandReversal: patternWeights.islandReversal,
			descendingTriangle: -patternWeights.ascendingTriangle,
			bearishFlag: -patternWeights.bullishFlag,
			doubleTop: -patternWeights.doubleBottom,
			risingWedge: -patternWeights.fallingWedge,
			headAndShoulders: -patternWeights.islandReversal,
		};

		for (let i = 50; i < closes.length; i++) {
			const sliceCloses = closes.slice(0, i + 1);
			const sliceHighs = highs.slice(0, i + 1);
			const sliceLows = lows.slice(0, i + 1);

			const indicators = calculateAllIndicators(sliceCloses, sliceHighs, sliceLows);
			const patternResult = detectPatterns(sliceHighs, sliceLows, sliceCloses, fullPatternWeights);

			// Use neutral VIX value (15) for backtesting since historical VIX isn't available per bar
			const indiaVix = 15;

			let buyScore = 0;
			let sellScore = 0;

			if (indicators.rsi < 30) buyScore += indicatorWeights.rsi;
			if (indicators.rsi > 70) sellScore += indicatorWeights.rsi;

			if (indicators.stochasticK < 20) buyScore += indicatorWeights.stochastic;
			if (indicators.stochasticK > 80) sellScore += indicatorWeights.stochastic;

			if (sliceCloses[i] <= indicators.bbLower) buyScore += indicatorWeights.bollinger;
			if (sliceCloses[i] >= indicators.bbUpper) sellScore += indicatorWeights.bollinger;

			if (sliceCloses[i] <= indicators.donchLower) buyScore += indicatorWeights.donchian;
			if (sliceCloses[i] >= indicators.donchUpper) sellScore += indicatorWeights.donchian;

			if (indicators.williamsR < -80) buyScore += indicatorWeights.williamsR;
			if (indicators.williamsR > -20) sellScore += indicatorWeights.williamsR;

			if (indiaVix > INDIA_VIX_HIGH_THRESHOLD) buyScore += indicatorWeights.indiaVix;
			if (indiaVix < INDIA_VIX_LOW_THRESHOLD) sellScore += indicatorWeights.indiaVix;

			if (indicators.macdHistogram > 0) buyScore += indicatorWeights.macd;
			if (indicators.macdHistogram < 0) sellScore += indicatorWeights.macd;

			if (sliceCloses[i] > indicators.sma20) buyScore += indicatorWeights.sma;
			if (sliceCloses[i] < indicators.sma20) sellScore += indicatorWeights.sma;

			if (sliceCloses[i] > indicators.ema20) buyScore += indicatorWeights.ema;
			if (sliceCloses[i] < indicators.ema20) sellScore += indicatorWeights.ema;

			if (patternResult.score > 0) buyScore += patternResult.score;
			if (patternResult.score < 0) sellScore += Math.abs(patternResult.score);

			if (buyScore >= thresholds.buy && buyScore >= sellScore) {
				signals.push("BUY");
			} else if (sellScore >= thresholds.sell && sellScore > buyScore) {
				signals.push("SELL");
			} else {
				signals.push("HOLD");
			}
		}

		return signals;
	}

	/**
	 * Simulate trades with Indian market transaction costs.
	 * STT + brokerage + stamp duty ≈ 0.15% per trade.
	 */
	private simulateTrades(closes: number[], signals: string[]): BacktestMetrics {
		let position = false;
		let entryPrice = 0;
		let equity = 10000; // Start with ₹10,000 notional
		let peakEquity = equity;
		let maxDrawdown = 0;
		const dailyReturns: number[] = [];
		let wins = 0;
		let losses = 0;
		let totalProfit = 0;
		let totalLoss = 0;
		let prevEquity = equity;

		const dataOffset = 50; // signals start at index 50

		for (let i = 0; i < signals.length; i++) {
			const closeIdx = i + dataOffset;
			const signal = signals[i];
			const price = closes[closeIdx];

			if (!position && signal === "BUY") {
				// Open position
				position = true;
				entryPrice = price;
				// Deduct buy-side transaction cost
				equity *= 1 - TRANSACTION_COST_PERCENT / 100;
			} else if (position && signal === "SELL") {
				// Close position
				const profitPercent = (price - entryPrice) / entryPrice;
				equity *= 1 + profitPercent;
				// Deduct sell-side transaction cost
				equity *= 1 - TRANSACTION_COST_PERCENT / 100;

				if (profitPercent > 0) {
					wins++;
					totalProfit += profitPercent;
				} else {
					losses++;
					totalLoss += Math.abs(profitPercent);
				}

				position = false;
			}

			// Track daily return
			const dailyReturn = (equity - prevEquity) / prevEquity;
			dailyReturns.push(dailyReturn);
			prevEquity = equity;

			// Track drawdown
			if (equity > peakEquity) peakEquity = equity;
			const drawdown = ((peakEquity - equity) / peakEquity) * 100;
			if (drawdown > maxDrawdown) maxDrawdown = drawdown;
		}

		// Close any open position at end
		if (position) {
			const lastPrice = closes[closes.length - 1];
			const profitPercent = (lastPrice - entryPrice) / entryPrice;
			equity *= 1 + profitPercent;
			equity *= 1 - TRANSACTION_COST_PERCENT / 100;

			if (profitPercent > 0) {
				wins++;
				totalProfit += profitPercent;
			} else {
				losses++;
				totalLoss += Math.abs(profitPercent);
			}
		}

		const totalTrades = wins + losses;
		const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
		const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
		const totalReturn = ((equity - 10000) / 10000) * 100;

		// Annualized Sharpe ratio (√252 for Indian trading days ≈ 250)
		const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
		const stdReturn = Math.sqrt(
			dailyReturns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / dailyReturns.length,
		);
		const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

		return {
			sharpeRatio,
			maxDrawdown,
			winRate,
			totalTrades,
			profitFactor,
			return: totalReturn,
		};
	}
}
