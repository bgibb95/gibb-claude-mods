# gibb-claude-mods

Mods for [Claude Code](https://claude.com/claude-code), packaged as a plugin marketplace.

## Mods

### session-cost

Shows what the current session has cost in a band just above the prompt, in the currency you pick.

```
◆ Session cost  £0.43                         Currency  [£ GBP ▾]
```

- The amount is Claude Code's own running total (the figure `/cost` shows), at API list prices. On a Pro or Max subscription it's an estimate, not what you're billed.
- Pick a currency from the dropdown, or run `/cost-currency GBP`. Supported: USD, GBP, EUR, JPY, CAD, AUD, INR, CHF, ZAR, NZD. Your choice is remembered across sessions.
- Exchange rates come from [Frankfurter](https://frankfurter.dev) (European Central Bank data) and are refreshed at most once a day. If they can't be fetched, built-in rates are used and the band says "(approx. rate)".
- The amount turns from green to amber past $1, and to red past $10.

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

## Developing

Each mod is a folder with `.claude-plugin/plugin.json`, `hooks/hooks.json` and a hooks module. With a local clone added as a marketplace (`claude plugin marketplace add <path to clone>`), Claude Code reads the mod straight from the folder: edit it and run `/reload-plugins`.

```bash
claude plugin validate session-cost
claude plugin test session-cost
```
