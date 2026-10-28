import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const BAND = {
  plugin: 'session-cost',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const LIVE = { GBP: 0.5, EUR: 0.9, JPY: 150 }

// Stands for the engine beneath the mod.
const engine = (on: On, options: { usd?: number; fetch?: 'ok' | 'fail' } = {}) => {
  const fetches: string[] = []
  on('command.register', () => ({ value: { command: 'cost-currency' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed, cwd: '/' }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200000 },
      rateLimits: [],
      ...(options.usd === undefined ? {} : { cost: { usd: options.usd } }),
    },
  }))
  on('http.fetch', (_, e) => {
    fetches.push(e.url)
    return options.fetch === 'fail'
      ? { value: { status: 503, ok: false, headers: {}, text: '' } }
      : { value: { status: 200, ok: true, headers: {}, text: JSON.stringify({ rates: LIVE }) } }
  })
  return fetches
}

const start = async (
  $: Engine,
  clock: ReturnType<typeof mock.clock>,
) => {
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // Rates load without holding up the session's start; let them land.
  await clock.settle()
}

test('the band shows the session cost and switches currency', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on, { now: 1_000 })
  engine(on, { usd: 2 })
  await start($, clock)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('$2.00')

    await ui.select({ key: 'currency', value: 'GBP' })
    expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('£1.00')

    await ui.select({ key: 'currency', value: 'USD' })
    await ui.unmount()
  }
})

test('the cost follows each measurement', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  engine(on, { usd: 0 })
  await start($, clock)

  await $.session.measure({
    context: { window: 200000 },
    rateLimits: [],
    cost: { usd: 0.426 },
    changed: ['cost'],
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('$0.43')
  await ui.unmount()
})

test('the chosen currency is kept from an earlier session', async ($, on) => {
  mock.store(on, { currency: 'JPY' })
  const clock = mock.clock(on)
  engine(on, { usd: 1 })
  await start($, clock)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('¥150')
  await ui.unmount()
})

test('rates fetched within a day are reused', async ($, on) => {
  mock.store(on, { rates: { values: { USD: 1, GBP: 0.8 }, fetchedAt: 0, isLive: true } })
  const clock = mock.clock(on, { now: 60_000 })
  const fetches = engine(on, { usd: 10 })
  await start($, clock)

  expect(fetches).toEqual([])
  await $.command.run({
    command: 'cost-currency',
    args: 'gbp',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('£8.00')
  await ui.unmount()
})

test('without live rates the built-in ones are marked approximate', async ($, on) => {
  mock.store(on, { currency: 'GBP' })
  const clock = mock.clock(on)
  engine(on, { usd: 4, fetch: 'fail' })
  await start($, clock)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('£3.00')
  expect(await ui.find({ type: 'Text', text: /approx/ })).toBeDefined()
  await ui.unmount()
})

test('mobile shows the cost without a picker', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  engine(on, { usd: 1.5 })
  await start($, clock)

  const ui = await $.ui.mount({ ...BAND, surface: 'mobile' })
  expect((await ui.find({ type: 'Text', text: /\d/ }))?.text).toBe('$1.50')
  await ui.unmount()
})

test('nothing is drawn before the first cost reading', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  engine(on)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  await start($, clock)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})
