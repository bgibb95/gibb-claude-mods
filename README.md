# gibb-claude-mods

Mods for [Claude Code](https://claude.com/claude-code), packaged as a plugin marketplace.

> **Early access.** Mods use Claude Code's function-hooks API, which is in early access and may change between releases. They need a recent Claude Code: if a mod doesn't appear, update the CLI, desktop app or VS Code extension.

## Mods

### session-cost

Shows what the current session has cost in a band just above the prompt, in the currency you pick.

```
◆ Session cost  £0.43                         Currency  [£ GBP ▾]
```

- The amount is Claude Code's own running total (the figure `/cost` shows), at API list prices. On a Pro or Max subscription it's an estimate, not what you're billed.
- Pick a currency from the dropdown, or run `/cost-currency GBP`. Supported: USD, GBP, EUR, JPY, CAD, AUD, INR, CHF, ZAR, NZD. Your choice is remembered across sessions.
- Exchange rates come from [Frankfurter](https://frankfurter.dev) (European Central Bank data) and are refreshed at most once a day. That request is the mod's only network call and sends nothing about you or your session. If it fails, the last rates fetched (or built-in ones) are used and the band says "(approx. rate)".
- The amount turns from green to amber past $1, and to red past $10.
- If another mod also draws above the prompt, its band stays and the cost row goes under it.

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

Each mod's `tsconfig.json` extends type declarations Claude Code writes into `.claude-plugin/types/` the first time it loads the mod (they're git-ignored). Until then `tsc -p session-cost` can't find them; `validate` and `test` work either way.

## License

[MIT](LICENSE)
