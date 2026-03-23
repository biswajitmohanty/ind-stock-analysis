import { existsSync, readFileSync, writeFileSync } from "node:fs";
import pino from "pino";
import type { Portfolio } from "../types/index.js";

const logger = pino({ name: "portfolio" });

const PORTFOLIO_PATH = ".portfolio.json";

/**
 * Load portfolio from disk.
 */
function loadPortfolio(): Portfolio {
	if (!existsSync(PORTFOLIO_PATH)) {
		return { assets: [], createdAt: new Date().toISOString() };
	}
	const raw = readFileSync(PORTFOLIO_PATH, "utf-8");
	return JSON.parse(raw);
}

/**
 * Save portfolio to disk.
 */
function savePortfolio(portfolio: Portfolio): void {
	writeFileSync(PORTFOLIO_PATH, JSON.stringify(portfolio, null, 2));
}

/**
 * Add a ticker to the portfolio.
 * Appends .NS suffix if no exchange suffix is provided.
 */
export function addAsset(ticker: string): Portfolio {
	const normalizedTicker = ensureExchangeSuffix(ticker);
	const portfolio = loadPortfolio();

	if (portfolio.assets.includes(normalizedTicker)) {
		logger.warn({ ticker: normalizedTicker }, "Ticker already in portfolio");
		return portfolio;
	}

	portfolio.assets.push(normalizedTicker);
	savePortfolio(portfolio);
	logger.info({ ticker: normalizedTicker }, "Added to portfolio");
	return portfolio;
}

/**
 * Remove a ticker from the portfolio.
 */
export function removeAsset(ticker: string): Portfolio {
	const normalizedTicker = ensureExchangeSuffix(ticker);
	const portfolio = loadPortfolio();
	portfolio.assets = portfolio.assets.filter((t) => t !== normalizedTicker);
	savePortfolio(portfolio);
	logger.info({ ticker: normalizedTicker }, "Removed from portfolio");
	return portfolio;
}

/**
 * Get the current portfolio.
 */
export function getPortfolio(): Portfolio {
	return loadPortfolio();
}

/**
 * Ensure ticker has an exchange suffix (.NS or .BO).
 * Defaults to .NS (NSE) if no suffix is present.
 */
function ensureExchangeSuffix(ticker: string): string {
	if (ticker.endsWith(".NS") || ticker.endsWith(".BO")) {
		return ticker;
	}
	return `${ticker}.NS`;
}
