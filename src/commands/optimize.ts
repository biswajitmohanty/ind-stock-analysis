import pino from "pino";
import { CURRENCY_SYMBOL } from "../constants.js";
import { Optimizer } from "../optimization/optimizer.js";
import { saveOptimizedConfig } from "../utils/config-loader.js";

const logger = pino({ name: "optimize-cmd" });

/**
 * Run optimization for a given symbol.
 * Searches for optimal indicator weights, pattern weights, and thresholds.
 */
export async function optimizeCommand(
	symbol: string,
	trials = 200,
): Promise<void> {
	// Ensure exchange suffix
	const normalizedSymbol =
		symbol.endsWith(".NS") || symbol.endsWith(".BO")
			? symbol
			: `${symbol}.NS`;

	console.log(`\n🔧 Optimizing parameters for ${normalizedSymbol}...`);
	console.log(`   Trials: ${trials}`);
	console.log("");

	const optimizer = new Optimizer();
	const result = await optimizer.optimize(normalizedSymbol, trials);

	console.log("\n" + "═".repeat(60));
	console.log("  OPTIMIZATION RESULTS");
	console.log("═".repeat(60));
	console.log(`  Symbol: ${result.symbol}`);
	console.log(`  Strategy: ${result.strategy}`);
	console.log(`  Trials: ${result.nTrials}`);
	console.log(`  Best Value: ${result.bestValue.toFixed(3)}`);
	console.log("");
	console.log("  Metrics:");
	console.log(`    Sharpe Ratio: ${result.metrics.sharpeRatio.toFixed(2)}`);
	console.log(`    Max Drawdown: ${result.metrics.maxDrawdown.toFixed(1)}%`);
	console.log(`    Win Rate: ${result.metrics.winRate.toFixed(1)}%`);
	console.log(`    Total Trades: ${result.metrics.totalTrades}`);
	console.log(`    Profit Factor: ${result.metrics.profitFactor.toFixed(2)}`);
	console.log(`    Return: ${result.metrics.return.toFixed(1)}%`);
	console.log("");
	console.log("  Optimized Weights:");
	const w = result.bestParams.indicatorWeights;
	console.log(`    RSI: ${w.rsi.toFixed(1)} | Stoch: ${w.stochastic.toFixed(1)} | BB: ${w.bollinger.toFixed(1)}`);
	console.log(`    Donch: ${w.donchian.toFixed(1)} | WillR: ${w.williamsR.toFixed(1)} | VIX: ${w.indiaVix.toFixed(1)}`);
	console.log(`    MACD: ${w.macd.toFixed(1)} | SMA: ${w.sma.toFixed(1)} | EMA: ${w.ema.toFixed(1)}`);
	console.log(`    Buy Threshold: ${result.bestParams.thresholds.buy}`);
	console.log(`    Sell Threshold: ${result.bestParams.thresholds.sell}`);
	console.log("═".repeat(60));

	// Save optimized config
	saveOptimizedConfig({
		symbol: result.symbol,
		indicatorWeights: result.bestParams.indicatorWeights,
		patternWeights: result.bestParams.patternWeights,
		thresholds: result.bestParams.thresholds,
		calibration: result.bestParams.calibration,
		metrics: {
			sharpeRatio: result.metrics.sharpeRatio,
			maxDrawdown: result.metrics.maxDrawdown,
			winRate: result.metrics.winRate,
			return: result.metrics.return,
		},
	});

	console.log("\nOptimized config saved to data/config/optimized_weights.json");
}
