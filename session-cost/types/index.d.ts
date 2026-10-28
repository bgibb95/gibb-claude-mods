export type Rates = {
  /** USD to each currency, by code. */
  values: Record<string, number>
  /** When the rates were fetched, in `$.clock.now()` milliseconds; 0 for the built-in table. */
  fetchedAt: number
  isLive: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'session-cost': {
      usd: number | null
      currency: string
      rates: Shaped<Rates>
    }
  }
}
