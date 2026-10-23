[中文](./README.zh-CN.md)

# DeepSeek Harness Extensions

This directory collects extensions for **DeepSeek Harness** (DSH) — the agent
runtime that powers DeepSeek's coding agents. Plugins live under
[`plugins/`](./plugins/), one folder per package, following the DSH plugin
conventions (`package.json` with a `dsh` manifest, a host half under `lib/`,
and a browser half for client plugins).

The [Linux launcher](./launcher/README.md) is a separate desktop helper for
starting and stopping the DSH Web UI.

## Available plugins

| Plugin | Function summary |
| --- | --- |
| [`dsh-client-ui-usage`](./plugins/dsh-client-ui-usage/README.md) [![npm version](https://img.shields.io/npm/v/dsh-client-ui-usage)](https://www.npmjs.com/package/dsh-client-ui-usage) | **Live usage meter in the session header**: context-window occupancy (`used / window` tokens, mini progress bar, streaming pulse) plus a real-time **per-model** billing estimate (pro / flash billed separately at their own rates, with a combined session total), a click-open detail panel, an official rate card (list / peak / off-peak), and a peak/off-peak badge. Bilingual EN/ZH UI. |

## Compatibility and contributions

Each plugin documents its own install method, runtime requirements, and
minimum DSH version. Client (web) plugins require the DSH web profile
(`dsh web`). Keep changes scoped to the relevant plugin folder, preserve the
bilingual READMEs (`README.md` + `README.zh-CN.md`), and validate that a
plugin still loads in the target profile before submitting changes.
