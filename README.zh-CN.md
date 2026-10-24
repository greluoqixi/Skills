[English](./README.md)

# Skills

这是一个公开仓库，用于集中存放面向各类 AI 编程 Agent 自建的 Skills、
Plugins 及其配套工具。

每个 Agent 生态使用独立的一级目录，避免混淆各自的格式、安装方式和兼容性要求。
Claude Code、Codex 与 DeepSeek Harness 是当前支持的生态，后续可以继续扩展其他
Agent。

## 仓库结构

| 目录 | 用途 |
| --- | --- |
| [`Claude Code/`](./Claude%20Code/README.zh-CN.md) | Claude Code Skills 与可安装 Plugins。 |
| [`Codex/`](./Codex/) | Codex Skills 与 Plugins。 |
| [`DeepSeek Harness/`](./DeepSeek%20Harness/README.zh-CN.md) | DeepSeek Harness（DSH）客户端与宿主 Plugins。 |

## 当前 Agent 与项目

### Claude Code

- [`claude-project-intelligence`](./Claude%20Code/claude-project-intelligence/README.zh-CN.md)
  — 面向大型代码仓库的项目导航、确定性索引和已验证 BUG 知识支持。
- [`china-job-search`](./Claude%20Code/china-job-search/README.zh-CN.md)
  — 面向中国大陆社招、校招、实习和央国企招聘的本地求职工作流。

Claude Code 相关的兼容性说明和项目导航请参阅
[Claude Code 集合说明](./Claude%20Code/README.zh-CN.md)。

### Codex

暂未添加公开项目。

### DeepSeek Harness

- [`launcher`](./DeepSeek%20Harness/launcher/README.zh-CN.md)
  — Linux 桌面启动器，提供依赖配置、独立 DSH Web 窗口和退出时的进程清理。
- [`dsh-client-ui-usage`](./DeepSeek%20Harness/plugins/dsh-client-ui-usage/README.zh-CN.md)
  — 在 DSH Web 会话头部提供实时上下文窗口占用率与按模型（pro/flash）分账的计费
  估算，点击可展开细分面板，并内置官方收费标准与高峰/空闲标记。
- [`dsh-client-voice-input`](./DeepSeek%20Harness/plugins/dsh-client-voice-input/README.zh-CN.md)
  — DSH 输入框的离线语音输入：按需安装 SenseVoiceSmall INT8，在本机转写并以一次
  可撤销编辑插入草稿，音频不上传云端。

DeepSeek Harness 相关的插件目录结构、安装方式与兼容性说明请参阅
[DeepSeek Harness 集合说明](./DeepSeek%20Harness/README.zh-CN.md)。

## 贡献约定

- Claude Code、Codex 与 DeepSeek Harness 扩展必须放在各自目录中。
- 每个项目应独立提供 README、许可证信息、兼容性说明、测试和安装方法。
- 不得提交凭据、私有项目知识、依赖生成目录或测试时克隆的外部仓库。
- 提交前应使用文档所声明的产品版本与运行时完成验证和测试。

新增其他 Agent 支持时，应建立独立的一级目录和简短的双语集合 README。
如项目未另行说明，兼容性与许可信息以各项目自身文档为准。
