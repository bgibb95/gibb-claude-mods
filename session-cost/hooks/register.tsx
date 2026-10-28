import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Rates } from '../types'

const CURRENCIES = {
  USD: { symbol: '$', decimals: 2 },
  GBP: { symbol: '£', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  JPY: { symbol: '¥', decimals: 0 },
  CAD: { symbol: 'C$', decimals: 2 },
  AUD: { symbol: 'A$', decimals: 2 },
  INR: { symbol: '₹', decimals: 2 },
  CHF: { symbol: 'CHF ', decimals: 2 },
  ZAR: { symbol: 'R', decimals: 2 },
  NZD: { symbol: 'NZ$', decimals: 2 },
} as const

type Currency = keyof typeof CURRENCIES

const CODES = Object.keys(CURRENCIES) as Currency[]

// Used until live rates arrive, or when they can't be fetched (Oct 2026).
const FALLBACK: Rates = {
  values: {
    USD: 1,
    GBP: 0.75,
    EUR: 0.9,
    JPY: 158,
    CAD: 1.4,
    AUD: 1.42,
    INR: 95,
    CHF: 0.83,
    ZAR: 16.6,
    NZD: 1.75,
  },
  fetchedAt: 0,
  isLive: false,
}

const DAY_MS = 24 * 60 * 60 * 1000
const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${CODES.filter(c => c !== 'USD').join(',')}`

const usd = atom({ plugin: 'session-cost', key: 'usd' } as const, null)
const currency = atom({ plugin: 'session-cost', key: 'currency' } as const, 'USD')
const rates = atom({ plugin: 'session-cost', key: 'rates' } as const, FALLBACK, {
  shape: 'rates-1',
})

const isCurrency = (code: string): code is Currency => code in CURRENCIES

const format = (amountUsd: number, code: string, table: Rates) => {
  const target: Currency = isCurrency(code) ? code : 'USD'
  const { symbol, decimals } = CURRENCIES[target]
  const amount = amountUsd * (table.values[target] ?? 1)
  const smallest = 1 / 10 ** decimals
  return amount > 0 && amount < smallest
    ? `<${symbol}${smallest.toFixed(decimals)}`
    : `${symbol}${amount.toFixed(decimals)}`
}

// Green while cheap, amber past $1, red past $10, whatever the currency shown.
const tone = (amountUsd: number) =>
  amountUsd < 1 ? 'success' : amountUsd < 10 ? 'warning' : 'error'

const loadRates = async ($: EngineInterface) => {
  const now = await $.clock.now()
  const cached = (await $.store.get('rates')) as Rates | undefined
  if (cached?.isLive && now - cached.fetchedAt < DAY_MS) {
    await update($, rates, () => cached)
    return
  }

  try {
    const response = await $.http.fetch(RATES_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = JSON.parse(response.text) as { rates: Record<string, number> }
    const fresh: Rates = {
      values: { ...FALLBACK.values, ...body.rates, USD: 1 },
      fetchedAt: now,
      isLive: true,
    }
    await $.store.set('rates', fresh)
    await update($, rates, () => fresh)
  } catch {
    // Offline or the service is down: keep yesterday's rates if we have them.
    await update($, rates, () => cached ?? FALLBACK)
  }
}

const setCurrency = async ($: EngineInterface, code: Currency) => {
  await update($, currency, () => code)
  await $.store.set('currency', code)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cost-currency',
      description: `Show the session cost in another currency (${CODES.join(', ')})`,
    })

    const saved = await $.store.get('currency')
    if (typeof saved === 'string' && isCurrency(saved)) {
      await update($, currency, () => saved)
    }

    const usage = await $.session.usage()
    if (usage.cost) {
      const total = usage.cost.usd
      await update($, usd, () => total)
    }

    void loadRates($).catch(() => undefined)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.cost) {
      const total = e.cost.usd
      await update($, usd, () => total)
    }

    return next(e)
  })

  on('command.run', { command: 'cost-currency' }, async ($, e) => {
    const code = e.args.trim().toUpperCase()

    if (code === '') {
      return { text: `Session cost is shown in ${await read($, currency)}. Pick one of: ${CODES.join(', ')}` }
    }
    if (!isCurrency(code)) {
      return { text: `Unknown currency "${code}". Pick one of: ${CODES.join(', ')}` }
    }

    await setCurrency($, code)
    const total = await read($, usd)
    const table = await read($, rates)
    const note = code !== 'USD' && !table.isLive ? ' (approx. rate)' : ''

    return {
      text:
        total === null
          ? `Session cost will be shown in ${code}.`
          : `Session cost: ${format(total, code, table)}${note}`,
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const total = await read($, usd)

    if (e.props.hasSurvey || total === null) {
      return next(e)
    }

    const code = await read($, currency)
    const table = await read($, rates)
    const elements = $.ui.resolve(e)
    const { Box, Text } = elements

    const summary = (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Text color="claude">◆</Text>
        <Text dimColor>Session cost</Text>
        <Text bold color={tone(total)}>
          {format(total, code, table)}
        </Text>
        {code !== 'USD' && !table.isLive && (
          <Text dimColor italic>
            (approx. rate)
          </Text>
        )}
      </Box>
    )

    if (e.surface === 'mobile' || !('Select' in elements)) {
      return summary
    }

    const { Select } = elements

    return (
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={2}>
        {summary}
        <Select
          key="currency"
          label="Currency"
          value={code}
          options={CODES.map(value => ({ value, label: `${CURRENCIES[value].symbol.trim()} ${value}` }))}
          onSelect={value => {
            if (isCurrency(value)) void setCurrency($, value)
          }}
        />
      </Box>
    )
  })
}
