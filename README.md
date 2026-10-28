# gibb-claude-mods

Mods for [Claude Code](https://claude.com/claude-code), packaged as a plugin marketplace.

> **Early access.** Mods use Claude Code's function-hooks API, which is in early access and may change between releases. They need a recent Claude Code: if a mod doesn't appear, update the CLI, desktop app or VS Code extension.

## Mods

| Mod | What it does |
| --- | --- |
| [session-cost](session-cost/README.md) | Shows the current session's cost above the prompt, in a currency you pick |

Each mod's README has its details.

## Install

At the prompt of a Claude Code terminal session, with `<mod>` the mod's name:

```
/plugin install <mod> --marketplace bgibb95/gibb-claude-mods
```

Answer `y` to add the marketplace, then choose the **user** scope to have it in every session. Or from a shell:

```bash
claude plugin marketplace add bgibb95/gibb-claude-mods
claude plugin install <mod>@gibb-claude-mods --scope user
```

## Developing

Each mod is a folder with `.claude-plugin/plugin.json`, `hooks/hooks.json`, a hooks module and a `README.md`, listed in [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json). With a local clone added as a marketplace (`claude plugin marketplace add <path to clone>`), Claude Code reads each mod straight from its folder: edit it and run `/reload-plugins`.

```bash
claude plugin validate .
claude plugin validate <mod>
claude plugin test <mod>
```

Each mod's `tsconfig.json` extends type declarations Claude Code writes into `.claude-plugin/types/` the first time it loads the mod (they're git-ignored). Until then `tsc -p <mod>` can't find them; `validate` and `test` work either way.

When you change a mod's behaviour, bump `version` in its `plugin.json` so `claude plugin update` picks it up.

## License

[MIT](LICENSE)
