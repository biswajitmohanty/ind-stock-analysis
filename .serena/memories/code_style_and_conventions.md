# Code Style and Conventions

## Language & Runtime

- **TypeScript** targeting ESNext
- **Bun** as primary runtime (Node.js compatible)
- Strict type checking enabled in `tsconfig.json`

## Formatting

- **Biome** for linting and formatting (`biome.json`)
- Tab width: 2 spaces
- Semicolons: required
- Quotes: double
- Trailing commas: all

## Import Conventions

- Relative imports within `src/` (e.g., `import { X } from "../services/indicators"`)
- No `@/` alias configured
- Module resolution: `bundler`
- Group order: external packages → internal modules → types

## Type Conventions

- All exported functions must have explicit return types
- All interfaces defined in `src/types/index.ts`
- `any` allowed only for raw API response parsing (Upstox, NSE, Yahoo)
- Prefer `interface` over `type` for object shapes

## Naming Conventions

- Files: `kebab-case.ts` (e.g., `data-fetcher.ts`, `csv-writer.ts`)
- Functions: `camelCase` (e.g., `getHistoricalPrices`, `calculateAllIndicators`)
- Interfaces: `PascalCase` (e.g., `TickerResult`, `IndicatorValues`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_INDIAN_TICKERS`, `CURRENCY_SYMBOL`)
- Enum-like objects: `PascalCase` keys

## Error Handling

- Data fetching: catch and return graceful defaults (empty array, null, neutral VIX=15)
- CLI: log error with Pino, skip ticker, continue batch
- Never throw unhandled — always catch at the command level

## Currency & Formatting

- Always use `₹` prefix for prices
- Market cap: Lakh Crore (≥10,000 Cr) or Crore
- Number formatting: `toLocaleString('en-IN')` for Indian notation
- Dates: Luxon with `Asia/Kolkata` timezone
