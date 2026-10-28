# session-cost

Shows what the current session has cost in a band just above the prompt, in the currency you pick.

```
◆ Session cost  £0.43                         Currency  [£ GBP ▾]
```

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-cost --marketplace bgibb95/gibb-claude-mods
```

Answer `y` to add the marketplace, then choose the **user** scope to have it in every session. Or from a shell:

```bash
claude plugin marketplace add bgibb95/gibb-claude-mods
claude plugin install session-cost@gibb-claude-mods --scope user
```

## How it works

- The amount is Claude Code's own running total (the figure `/cost` shows), at API list prices. On a Pro or Max subscription it's an estimate, not what you're billed. The band appears after the session's first reply.
- Pick a currency from the dropdown, or run `/cost-currency GBP` (`/cost-currency` on its own lists them). Supported: USD, GBP, EUR, JPY, CAD, AUD, INR, CHF, ZAR, NZD. Your choice is remembered across sessions.
- Exchange rates come from [Frankfurter](https://frankfurter.dev) (European Central Bank data) and are refreshed at most once a day. That request is the mod's only network call and sends nothing about you or your session. If it fails, the last rates fetched (or built-in ones) are used and the band says "(approx. rate)".
- The amount turns from green to amber past $1, and to red past $10.
- If another mod also draws above the prompt, its band stays and the cost row goes under it.
- Works in the terminal, the desktop app and VS Code. Claude's mobile app shows the amount without the picker.

Your currency and the cached rates are kept in `~/.claude/plugins/store/session-cost_<marketplace>-<id>.json`. Delete that file to reset to USD.

## Developing

```bash
claude plugin validate session-cost
claude plugin test session-cost
```

The code is in [hooks/register.tsx](hooks/register.tsx) and the tests in [hooks/register.test.tsx](hooks/register.test.tsx).
