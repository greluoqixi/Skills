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

在包含 `Claude Code/` 的目录中运行：

```text
claude plugin marketplace add "./Claude Code"
claude plugin install claude-project-intelligence@claude-code-project-tools --scope project
```

已有会话中运行 `/reload-plugins`。开发时也可直接使用：

```text
claude --plugin-dir "./Claude Code/claude-project-intelligence"
```

## 更新与卸载

```text
claude plugin marketplace update claude-code-project-tools
claude plugin update claude-project-intelligence@claude-code-project-tools --scope project
claude plugin uninstall claude-project-intelligence@claude-code-project-tools --scope project
```

卸载工具不会删除目标仓库的 Project Index、BUG Knowledge 或 `CLAUDE.md` managed block。删除项目数据必须使用独立且显式的 `cpi knowledge purge`。

## 快速开始

1. 在目标仓库打开 Claude Code。
2. 运行 `/claude-project-intelligence:project-bootstrap .`。
3. 应用前审核语义 Area 和 Module 候选。
4. 用 `/claude-project-intelligence:project-context <任务>` 路由任务。
5. 修复故障时使用 `/claude-project-intelligence:fix-with-history <症状>`。

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

- 运行 `claude plugin validate ./Claude Code/claude-project-intelligence --strict`。
- 检查 `node --version` 和 `claude --version`。
- 运行 `cpi knowledge doctor --repo . --format json`。
- 中断更新后运行 `cpi index repair --repo .`。
- GitHub 仓库测试可跳过，核心验证不依赖网络。

## 文档

- [架构](./docs/architecture.md)
- [Schema](./docs/schemas.md)
- [测试](./docs/testing.md)
- [当前版本：v0.1.0](./docs/versions/v0.1.0.zh-CN.md)
