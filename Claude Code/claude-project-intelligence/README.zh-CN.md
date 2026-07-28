[English](./README.md)

# Claude Project Intelligence

这是一个可安装的 Claude Code Plugin，用于语义化仓库导航、确定性文件索引和经过审核的 BUG 知识。它补充而不是替代 `/init`：`/init` 生成通用项目说明，本插件为大型且持续变化的仓库维护有预算、可查询的知识。

## 组件

- `project-bootstrap` 初始化简短 `CLAUDE.md` 协议、Project Index、manifest 和 BUG 库。
- `project-context` 最多路由到五个模块，并把大范围探索交给隔离 Subagent。
- `fix-with-history` 将旧修复当作假设，新记录只能是 candidate。
- `knowledge-review` 强制人工确认和生命周期规则。
- Hooks 标记已初始化仓库为 dirty，并在 turn/session 边界 reconciliation。
- `cpi` CLI 负责扫描、验证、修复、检索、安全检查和迁移。
- 符号定义和引用交给 Claude Code LSP；本插件不重复构建调用图。

## 支持范围和要求

扫描器与语言无关，支持 macOS、Linux 上的单体、monorepo 和多语言仓库。Windows 11 为预览支持。

- Claude Code 2.1.218 或更高；首个测试目标为 2.1.220
- Node.js 20 或更高
- 推荐但不强制 Git
- 不需要数据库、云服务、向量库或安装目标仓库依赖

## 安装

直接从公开 GitHub Marketplace 安装，不需要克隆本仓库。在 Claude Code 中运行：

```text
/plugin marketplace add greluoqixi/Skills
/plugin install claude-project-intelligence@greluoqixi-skills
/reload-plugins
```

默认安装到 user scope，可在你的所有项目中使用。如需在某个目标仓库中共享启用配置，
请在该目标仓库的终端中运行：

```text
claude plugin marketplace add greluoqixi/Skills
claude plugin install claude-project-intelligence@greluoqixi-skills --scope project
```

## 更新与卸载

在 Claude Code 中运行：

```text
/plugin marketplace update greluoqixi-skills
/reload-plugins
/plugin uninstall claude-project-intelligence@greluoqixi-skills
```

卸载工具不会删除目标仓库的 Project Index、BUG Knowledge 或 `CLAUDE.md` managed block。删除项目数据必须使用独立且显式的 `cpi knowledge purge`。

## 快速开始

在需要处理的目标仓库中打开 Claude Code，然后复制与你的任务匹配的提示词。
Plugin Skills 使用命名空间，所以下列每条提示词都明确指定了本插件中的 Skill。

初始化或刷新项目智能知识：

```text
/claude-project-intelligence:project-bootstrap .
```

实现任务前定位最小相关上下文：

```text
/claude-project-intelligence:project-context 增加可配置的会话过期时间，但不能改变认证模块的公共 API。请先定位相关模块、入口、符号、测试、规则和 BUG 历史。
```

将已审核的历史经验作为假设来排查 BUG：

```text
/claude-project-intelligence:fix-with-history 用户刷新原本有效的会话后立即收到 AUTH-401。请复现问题，检索适用的 BUG 历史，独立验证当前根因，实施最小合理修复并增加回归测试。
```

审核 candidate BUG 记录，判断是否可经人工确认后晋升：

```text
/claude-project-intelligence:knowledge-review BUG-AUTH-0001
```

请将示例任务、症状或 BUG ID 替换为你的实际内容。在目标仓库根目录打开
Claude Code 时，bootstrap 参数保留为 `.`。该 Skill 会先展示语义 Area 和
Module 变更供审核，再执行写入。

bootstrap 会创建 `.claude/project-intelligence.yaml`、项目与 BUG 知识目录、短导航规则和 `CLAUDE.md` managed block；现有内容会保留。

## 索引操作

```text
cpi index search --repo . --query "authentication session expiry"
cpi index verify --repo .
cpi index reconcile --repo .
cpi index repair --repo .
cpi index rebuild --repo .
```

根索引只负责路由，不是文件树。模块卡片描述语义职责并只列少量关键文件；完整文件清单保存在 JSONL 中，由 CLI 查询。

## BUG 知识

首次检索最多返回五条摘要，完整记录最多读取两条。candidate 是待审核经验；verified 还必须具备证据、回归测试或例外、适用边界、仓库引用、敏感信息检查和人工或正式评审。

```text
cpi bug search --repo . --query "AUTH-401 expired session"
cpi bug validate --repo . --file .claude/bug-knowledge/candidates/BUG-AUTH-0001.md
cpi bug promote --repo . --id BUG-AUTH-0001 --reviewed-by alice --confirm BUG-AUTH-0001
```

## 安全与限制

CLI 只写目标仓库根 `CLAUDE.md` 和 `.claude/` 知识路径；拒绝路径穿越，不跟随目录符号链接，跳过常见密钥、大文件和二进制文件，也不会执行目标仓库脚本。Hooks 具有本地用户权限，启用前应检查。

模块语义仍需审核；相似 rename 可能不确定；LSP 质量取决于已安装的语言服务器。v0.1.0 不提供 AST 调用图、embedding、向量检索、数据库、云同步或自动 BUG 晋升。

## 故障排查

- 运行 `/plugin marketplace update greluoqixi-skills`，然后运行 `/reload-plugins`。
- 在 `/plugin` 的 Installed 页确认插件已启用。
- 检查 `node --version` 和 `claude --version`。
- 运行 `cpi knowledge doctor --repo . --format json`。
- 中断更新后运行 `cpi index repair --repo .`。
- GitHub 仓库测试可跳过，核心验证不依赖网络。

## 文档

- [架构](./docs/architecture.md)
- [Schema](./docs/schemas.md)
- [测试](./docs/testing.md)
- [当前版本：v0.1.0](./docs/versions/v0.1.0.zh-CN.md)
