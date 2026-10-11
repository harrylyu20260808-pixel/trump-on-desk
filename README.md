<div align="center">

# 🇺🇸 Trump on Desk

**A cartoon desk buddy that watches your AI coding work.**
一个监视你 AI 编程工作的卡通桌宠。

[English](./README.md) · [中文](./README.zh-CN.md)

![demo](assets/demo.gif)

[![Platform](https://img.shields.io/badge/platform-Windows%20x64-blue)]()
[![Electron](https://img.shields.io/badge/Electron-33-47848F)]()
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-or--later-red)]()

</div>

---

## What is this?

**Trump on Desk** is a tiny always-on-top mascot on your screen. It listens to your
AI coding tools and reacts in real time. It ships in **two switchable styles** — a
rounded **cartoon** look and a chunky **pixel** look — toggle anytime from the dashboard.

![preview](assets/pet-preview.png)

- 🧠 **Thinking** — tilts head, opens its mouth.
- ⌨️ **Working** — "types" with both arms while tools run.
- 🎧 **Subagent** — puts on headphones and grooves.
- 🎉 **Done** — pumps a fist with a grin.
- 😤 **Error** — crosses arms and frowns.
- 💤 **Sleep** — nods off after you leave it alone.

Architecture inspired by [clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk).
This project is a clean-room re-implementation under the same **AGPL-3.0-or-later**
license; only the idea is borrowed, no code is copied.

## Features

| Feature | Detail |
|---|---|
| Character | Two styles — hand-drawn **cartoon** vector and **pixel** art, CSS keyframe animation, switchable live |
| AI hooks | Claude Code, Cursor, Codex CLI — one-click install / uninstall |
| Local server | 127.0.0.1 hook receiver; nothing leaves your machine |
| Bilingual UI | English / 中文, live toggle |
| Dashboard | Sessions, hook status, style / size / language, reminders |
| Interactions | Click = thumbs up, double-click = rally, right-click = menu |
| Build | electron-builder NSIS installer for Windows x64 |

## Quick start

Requires [Node.js 18+](https://nodejs.org/).

```bash
npm install
npm test      # unit tests
npm start     # launch the desktop pet + dashboard
```

Build the Windows installer:

```bash
npm run pack:win
# output: release/Trump on Desk Setup <version>.exe
```

> If the Electron binary download is slow in China, set the mirror first:
> `set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`

## Switching styles

Open the dashboard → **Settings** → **Pet style** → choose **Cartoon** or **Pixel**.
The change applies instantly to the live pet, no restart.

## Connecting your AI tools

Open the dashboard → **Agents** tab → click **Install** next to each tool.

| Tool | Writes |
|---|---|
| Claude Code | `~/.claude/settings.json` hook buckets |
| Cursor | `~/.cursor/hooks.json` |
| Codex CLI | read-only polling of `~/.codex/sessions/*.jsonl` |

**Uninstall** removes only this app's entries.

## Controls

| Input | Action |
|---|---|
| Drag | Move the pet |
| Left-click | Thumbs-up |
| Double-click | Rally pump |
| Right-click | Interactions menu |
| Tray icon | Dashboard / show-hide / quit |

## Project layout

```
trump-on-desk/
├── src/main/      # Electron main: windows, tray, hooks, event server, state machine
├── src/renderer/  # pet (cartoon + pixel SVG) + dashboard
├── src/shared/    # event normalization + bilingual strings
├── hooks/emit.js  # callback invoked by AI tools
├── tools/         # icon & demo GIF generators
└── test/run-tests.js
```

## License

**AGPL-3.0-or-later** — see [LICENSE](./LICENSE). The character is a parody mascot
for fun; not affiliated with anyone.
