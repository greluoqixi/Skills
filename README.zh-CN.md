[English](./README.md)

# Skills

这是一个公开仓库，用于集中存放面向各类 AI 编程 Agent 自建的 Skills、
Plugins 及其配套工具。

每个 Agent 生态使用独立的一级目录，避免混淆各自的格式、安装方式和兼容性要求。
Claude Code 与 Codex 是当前首批支持的生态，后续可以继续扩展其他 Agent。

## 仓库结构

| 目录 | 用途 |
| --- | --- |
| [`Claude Code/`](./Claude%20Code/README.zh-CN.md) | Claude Code Skills 与可安装 Plugins。 |
| [`Codex/`](./Codex/) | Codex Skills 与 Plugins。 |

## 当前 Agent 与项目

### Claude Code

- [`claude-project-intelligence`](./Claude%20Code/claude-project-intelligence/README.zh-CN.md)
  — 面向大型代码仓库的项目导航、确定性索引和已验证 BUG 知识支持。

Claude Code 相关的兼容性说明和项目导航请参阅
[Claude Code 集合说明](./Claude%20Code/README.zh-CN.md)。

### Codex

暂未添加公开项目。

## 贡献约定

- Claude Code 与 Codex 扩展必须放在各自目录中。
- 每个项目应独立提供 README、许可证信息、兼容性说明、测试和安装方法。
- 不得提交凭据、私有项目知识、依赖生成目录或测试时克隆的外部仓库。
- 提交前应使用文档所声明的产品版本与运行时完成验证和测试。

新增其他 Agent 支持时，应建立独立的一级目录和简短的双语集合 README。
如项目未另行说明，兼容性与许可信息以各项目自身文档为准。
