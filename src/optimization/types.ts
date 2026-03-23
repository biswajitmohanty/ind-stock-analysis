import type { IndicatorWeights, PatternWeights } from "../types/index.js";

export interface OptimizationParams {
	indicatorWeights: IndicatorWeights;
	patternWeights: Pick<
		PatternWeights,
		"ascendingTriangle" | "bullishFlag" | "doubleBottom" | "fallingWedge" | "islandReversal"
	>;
	thresholds: {
		buy: number;
		sell: number;
	};
	calibration: {
		slope: number;
		intercept: number;
	};
}

export interface OptimizationResult {
	strategy: string;
	symbol: string;
	bestValue: number;
	bestParams: OptimizationParams;
	nTrials: number;
	metrics: BacktestMetrics;
}

export interface BacktestMetrics {
	sharpeRatio: number;
	maxDrawdown: number;
	winRate: number;
	totalTrades: number;
	profitFactor: number;
	return: number;
}
