<div align="center">

# 🇺🇸 Trump on Desk

**一个监视你 AI 编程工作的卡通桌宠。**

[English](./README.md) · [中文](./README.zh-CN.md)

![demo](assets/demo.gif)

[![Platform](https://img.shields.io/badge/platform-Windows%20x64-blue)]()
[![Electron](https://img.shields.io/badge/Electron-33-47848F)]()
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-or--later-red)]()

</div>

---

## 这是什么？

**Trump on Desk** 是一只置顶在屏幕上的小桌宠，实时监听你的 AI 编程工具。
内置**两种可随时切换的风格**：圆润的**卡通**风与方块**像素**风，在面板里一键切换。

![preview](assets/pet-preview.png)

- 🧠 **思考** — 歪头、张嘴；
- ⌨️ **干活** — 双臂交替打字；
- 🎧 **子代理** — 戴上耳机摇摆；
- 🎉 **完成** — 举拳大笑；
- 😤 **出错** — 抱臂皱眉；
- 💤 **空闲** — 久不理就打瞌睡。

架构思路来自 [clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk)。
本项目以同样的 **AGPL-3.0-or-later** 协议从零重写，只借鉴思路、不复制代码。

## 特性

| 功能 | 说明 |
|---|---|
| 角色 | 双风格：手绘**卡通**矢量 + **像素**风，CSS 关键帧动画，实时切换 |
| AI 监听 | Claude Code / Cursor / Codex CLI，一键安装卸载 |
| 本地服务 | 127.0.0.1 接收端，数据不出本机 |
| 双语界面 | 中英实时切换 |
| 面板 | 会话、Hook 状态、风格/大小/语言、提醒 |
| 互动 | 单击点赞、双击造势、右键菜单 |
| 打包 | electron-builder 输出 Windows x64 NSIS 安装器 |

## 快速开始

需要 [Node.js 18+](https://nodejs.org/)。

```bash
npm install
npm test          # 单元测试
npm start         # 启动桌宠 + 面板
```

打包 Windows 安装器：

```bash
npm run pack:win
# 产物：release/Trump on Desk Setup <version>.exe
```

> 国内下载 Electron 慢可先设镜像：
> `set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`

## 切换风格

打开面板 → **设置** → **桌宠风格** → 选 **卡通** 或 **像素**。
切换即时生效，无需重启。

## 连接 AI 工具

打开面板 → **代理** 页签，点 Install。

| 工具 | 写入位置 |
|---|---|
| Claude Code | `~/.claude/settings.json` |
| Cursor | `~/.cursor/hooks.json` |
| Codex CLI | 只读轮询 `~/.codex/sessions/*.jsonl` |

**卸载**只移除本应用写入的条目。

## 操作

| 操作 | 效果 |
|---|---|
| 拖拽 | 移动桌宠 |
| 左键 | 点赞 |
| 双击 | 造势 |
| 右键 | 互动菜单 |
| 托盘 | 面板 | 显示隐藏 / 退出 |

## 目录结构

```
trump-on-desk/
├── src/main/      # 主进程：窗口、托盘、Hook、事件服务、状态机
├── src/renderer/  # pet（卡通 + 像素 SVG）+ dashboard（面板）
├── src/shared/    # 事件归一化 + 中英文字典
├── hooks/emit.js  # AI 工具回调脚本
├── tools/         # 图标与 demo GIF 生成脚本
└── test/run-tests.js
```

## 协议

**AGPL-3.0-or-later**，详见 [LICENSE](./LICENSE)。角色为娱乐向恶搞吉祥物，与任何真人无关。
