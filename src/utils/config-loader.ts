import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import pino from "pino";
import {
	BUY_THRESHOLD,
	DEFAULT_CALIBRATION,
	INDICATOR_WEIGHTS,
	PATTERN_WEIGHTS,
	SELL_THRESHOLD,
} from "../constants.js";

const logger = pino({ name: "config-loader" });

const CONFIG_PATH = "data/config/optimized_weights.json";
const CONFIG_VERSION = 1;

interface OptimizedConfig {
	version: number;
	updatedAt: string;
	symbol: string;
	indicatorWeights: typeof INDICATOR_WEIGHTS;
	patternWeights: {
		ascendingTriangle: number;
		bullishFlag: number;
		doubleBottom: number;
		fallingWedge: number;
		islandReversal: number;
	};
	thresholds: { buy: number; sell: number };
	calibration: { slope: number; intercept: number };
	metrics?: {
		sharpeRatio: number;
		maxDrawdown: number;
		winRate: number;
		return: number;
	};
}

/**
 * Load optimized configuration or fall back to defaults.
 */
export function loadOptimizedConfig() {
	try {
		if (!existsSync(CONFIG_PATH)) {
			logger.info("No optimized config found, using defaults");
			return getDefaults();
		}

		const raw = readFileSync(CONFIG_PATH, "utf-8");
		const config: OptimizedConfig = JSON.parse(raw);

		if (config.version !== CONFIG_VERSION) {
			logger.warn(
				{ expected: CONFIG_VERSION, found: config.version },
				"Config version mismatch, using defaults",
			);
			return getDefaults();
		}

		logger.info(
			{ symbol: config.symbol, updatedAt: config.updatedAt },
			"Loaded optimized config",
		);

		return {
			indicatorWeights: config.indicatorWeights,
			patternWeights: {
				...PATTERN_WEIGHTS,
				ascendingTriangle: config.patternWeights.ascendingTriangle,
				bullishFlag: config.patternWeights.bullishFlag,
				doubleBottom: config.patternWeights.doubleBottom,
				fallingWedge: config.patternWeights.fallingWedge,
				islandReversal: config.patternWeights.islandReversal,
				// Bearish mirrors
				descendingTriangle: -config.patternWeights.ascendingTriangle,
				bearishFlag: -config.patternWeights.bullishFlag,
				doubleTop: -config.patternWeights.doubleBottom,
				risingWedge: -config.patternWeights.fallingWedge,
				headAndShoulders: -config.patternWeights.islandReversal,
			},
			thresholds: config.thresholds,
			calibration: config.calibration,
		};
	} catch (error) {
		logger.error({ error }, "Failed to load config, using defaults");
		return getDefaults();
	}
}

/**
 * Save optimized configuration to disk.
 */
export function saveOptimizedConfig(config: {
	symbol: string;
	indicatorWeights: typeof INDICATOR_WEIGHTS;
	patternWeights: {
		ascendingTriangle: number;
		bullishFlag: number;
		doubleBottom: number;
		fallingWedge: number;
		islandReversal: number;
	};
	thresholds: { buy: number; sell: number };
	calibration: { slope: number; intercept: number };
	metrics?: {
		sharpeRatio: number;
		maxDrawdown: number;
		winRate: number;
		return: number;
	};
}): void {
	const dir = dirname(CONFIG_PATH);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const data: OptimizedConfig = {
		version: CONFIG_VERSION,
		updatedAt: new Date().toISOString(),
		...config,
	};

	writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
	logger.info({ path: CONFIG_PATH, symbol: config.symbol }, "Saved optimized config");
}

function getDefaults() {
	return {
		indicatorWeights: INDICATOR_WEIGHTS,
		patternWeights: PATTERN_WEIGHTS,
		thresholds: { buy: BUY_THRESHOLD, sell: SELL_THRESHOLD },
		calibration: DEFAULT_CALIBRATION,
	};
}
