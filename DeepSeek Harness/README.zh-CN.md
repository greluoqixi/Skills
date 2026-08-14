[English](./README.md)

# DeepSeek Harness 扩展

本目录收集面向 **DeepSeek Harness**（DSH）—— 驱动 DeepSeek 编程 Agent 的运行时
—— 的插件。插件按包分别放在 [`plugins/`](./plugins/) 目录下，遵循 DSH 插件规范
（含 `dsh` 清单的 `package.json`、`lib/` 下的宿主端，以及客户端插件的浏览器端）。

## 现有插件

| 插件 | 功能概括 |
| --- | --- |
| [`dsh-client-ui-usage`](./plugins/dsh-client-ui-usage/README.zh-CN.md) | **会话头部实时用量仪表**：上下文窗口占用率（`已用 / 窗口` tokens、迷你进度条、流式脉动指示）与实时**按模型分账**的计费估算（pro / flash 分别按各自费率计费，并给出合并的会话合计），点击展开详情面板，内置官方收费标准（现行 / 高峰 / 空闲）与高峰/空闲徽标。中英文双语界面。 |

## 兼容性与贡献约定

每个插件自行说明安装方式、运行环境与最低 DSH 版本。客户端（Web）插件需要 DSH
web profile（`dsh web`）。改动应限定在对应插件目录内，保持双语 README
（`README.md` + `README.zh-CN.md`），并在提交前验证插件能在目标 profile 中正常
加载。
