[English](./README.md)

# China Job Search

China Job Search 是面向中国大陆企业求职全流程的本地优先 Claude Code 插件，覆盖候选人档案、岗位发现、资格与匹配分析、定制申请材料、笔面试准备、Offer 对比、跟进和结果追踪。

它完整吸收 [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) 中结构化本地数据、证据复用、逐岗位定制、独立审核和结果反馈等核心思想，并将丹麦专用假设替换为中国大陆的招聘轨道、渠道边界、隐私要求、材料习惯和风险检查。

插件支持社招、校招、实习和央国企市场化招聘，不面向公务员或事业单位招录考试。

## 完整工作流

```text
建立工作区与候选人档案
          ↓
发现或导入岗位 → 标准化与去重 → 检查资格并评估匹配度
                                          ↓
追踪结果 ← 准备笔面试 ← 审核并生成申请材料
   ↓
跟进、比较 Offer、汇总能力缺口，并改进下一轮搜索
```

个人资料和生成文件均保存在本地 `job-search-cn/` 工作区。插件负责整理证据、辅助判断和起草材料；最终核对、投递和沟通始终由用户完成。

## 核心功能

- **有证据来源的候选人档案：** 从简历、公开主页或引导式问答导入信息，记录重要事实的来源与置信度，并将敏感网申字段和公开简历内容隔离。
- **中国大陆岗位发现：** 支持企业招聘官网、公开招聘与高校就业页面、公开搜索结果，以及用户提供的链接或 JD；区分社招、校招、实习和央国企市场化招聘。
- **标准化本地岗位库：** 将不同格式的 JD 统一为结构化记录，保留来源链接和时间信息，识别重复或可能失效的岗位。
- **先资格、后匹配：** 先检查毕业时间、学历、专业、工作许可、地点、经验、语言、证书等硬性条件，再评估匹配度。
- **可解释的岗位排序：** 区分硬性要求和偏好项，用候选人证据解释评分；薪资或要求未披露时不制造虚假的精确结论。
- **申请材料生成：** 起草中文或双语简历、网申字段、邮件正文、平台开场白和可选求职信，不虚构经历。
- **独立审核：** 由独立 Agent 检查事实依据、岗位针对性、表达质量、风险和交付完整性。
- **PDF 与 ATS 检查：** 内置 XeLaTeX 中文模板，并可用 Poppler 检查页数和文本层是否可提取。
- **笔试面试准备：** 生成岗位化题库、STAR 证据映射、公司调研任务、笔试计划和反问问题。
- **结果闭环：** 记录阶段与结果、起草跟进、对比 Offer、汇总能力缺口，并生成本地 HTML 报告。

## 安全与访问边界

插件不会绕过登录、验证码、robots 规则、反爬措施、付费墙或私有接口。对于限制自动访问的平台，应使用公开搜索结果、手动打开网站，或把岗位链接/正文粘贴给 Claude Code。插件不会自动投递、接受 Offer 或发送消息。

遇到押金、付费培训、购买设备、出借账户、扣留证件原件、索要银行凭据或要求脱离官方渠道转账等情况，应视为高风险信号，并通过企业官方渠道核验用人单位和招聘人员身份。

## 环境要求

- 支持插件的 Claude Code
- Python 3.10+
- 用于内置 PDF 模板的 XeLaTeX 与 CTeX
- 可选但推荐：Poppler（`pdfinfo` 和 `pdftotext`），用于 PDF/ATS 机械检查

没有 XeLaTeX 或 Poppler 时，岗位发现和分析流程仍可使用，只会跳过相应文档检查。

## 安装

### 从本仓库 Marketplace 安装

在终端执行：

```bash
claude plugin marketplace add greluoqixi/Skills
claude plugin install china-job-search@greluoqixi-skills
```

安装完成后，在希望开展求职工作的目录启动 Claude Code。

### 从本地仓库直接运行

```bash
git clone https://github.com/greluoqixi/Skills.git
cd Skills
claude --plugin-dir "./Claude Code/china-job-search"
```

## 详细使用方式：完成一次端到端求职流程

下面的斜杠命令是稳定入口，也可以直接用自然语言描述同一任务。通用提示词中的 `<城市>`、`<岗位>` 等是占位符，使用时替换为自己的信息即可。

### 第 1 步：建立工作区和候选人档案

执行：

```text
/china-job-search:setup
```

也可以指定工作区绝对路径：

```text
/china-job-search:setup /absolute/path/to/job-search-cn
```

通用提示词示例：

```text
帮我建立一个本地求职工作区。以 <简历路径> 作为初始资料，只追问缺失且重要的信息，区分公开简历事实和敏感网申字段，并在保存前让我确认候选人档案。
```

初始化时可以选择三种方式：导入现有简历或文档、导入公开个人主页，或完成引导式问答。完成后会得到结构化候选人档案、求职偏好、搜索配置和默认保护隐私的本地工作区。

### 第 2 步：在经历或证据变化后刷新档案

执行：

```text
/china-job-search:profile-refresh <简历路径或公开主页 URL>
```

通用提示词示例：

```text
根据 <文档路径或公开 URL> 刷新我的候选人档案。先展示新增内容、事实冲突和低置信度信息，在我确认前不要覆盖已经确认的事实。
```

第一次使用时可以跳过此步；完成新项目、证书、实习、业绩成果或简历改版后建议执行。

### 第 3 步：发现或导入岗位

执行宽泛或定向搜索：

```text
/china-job-search:search <关键词、城市或招聘轨道>
```

示例：

```text
/china-job-search:search 北京 后端开发 社招
/china-job-search:search 2027届 算法工程师 校招 上海
```

通用提示词示例：

```text
查找目前仍开放的 <社招/校招/实习/央国企市场化招聘> <岗位方向>，城市为 <城市列表>。优先企业官方来源，保留来源链接、发布日期或截止时间，标记访问限制，不绕过登录或反爬措施。
```

如果已经找到岗位，可以直接粘贴 URL 或 JD，无需再次搜索。插件会标准化岗位，并在写入本地岗位库前征求确认。

### 第 4 步：检查资格并排列岗位优先级

执行：

```text
/china-job-search:rank all
```

或者只评估指定岗位 ID：

```text
/china-job-search:rank <岗位ID-1> <岗位ID-2>
```

通用提示词示例：

```text
评估我保存的岗位。先检查硬性资格，再评估匹配度；区分必须条件和偏好条件；所有重要评分都要引用候选人档案中的证据；最后按“立即申请、先核实、跳过”给出短名单。
```

未知条件应保留为待核实，不能默认通过。校招重点检查毕业时间窗口和应届身份；社招重点核对经验年限和职责范围；央国企市场化招聘重点核对公告中的资格条件和截止日期。

### 第 5 步：生成并审核申请材料

可以传入已保存岗位 ID、URL、本地文件或粘贴的 JD：

```text
/china-job-search:apply <岗位来源>
```

通用提示词示例：

```text
为 <岗位 URL 或粘贴的 JD> 准备申请材料。先展示资格结论、匹配点、缺口和风险，在我确认后再定制简历，并起草需要的网申字段和沟通文案。只使用有依据的事实，随后执行独立审核；工具链可用时编译最终 PDF。
```

申请流程包含明确的质量闸门：

1. 解析并标准化岗位。
2. 检查硬性资格，识别缺失信息。
3. 解释匹配证据、能力缺口和风险信号。
4. 生成最终材料前请求用户确认。
5. 只制作当前投递渠道真正需要的文件和文案。
6. 执行独立的事实与质量审核。
7. 条件允许时编译 PDF，并做机械检查。
8. 用户批准后归档材料并更新 tracker。

插件不会虚构经历或关键词，也不会代替用户提交申请。

### 第 6 步：准备笔试和面试

执行：

```text
/china-job-search:interview <申请ID> <阶段>
```

示例：

```text
/china-job-search:interview app-20260801-001 technical
```

通用提示词示例：

```text
帮我准备申请 <申请ID> 的 <笔试/HR面/技术面/主管面/终面>。根据 JD 和我的真实经历生成问题，把可复用经历整理成 STAR 证据，指出薄弱项，加入公司调研任务，并制定未来 <天数> 天的可执行练习计划。
```

### 第 7 步：记录结果、跟进并比较 Offer

记录阶段或状态：

```text
/china-job-search:outcome <申请ID> <状态>
```

导入消息或截图转写文本：

```text
/china-job-search:outcome <申请ID> import
```

起草跟进消息：

```text
/china-job-search:outcome <申请ID> followup
```

通用提示词示例：

```text
根据这段招聘方消息更新申请 <申请ID>：<粘贴消息>。只提取明确事实，区分已确认内容和推断，指出下一步动作与期限，并起草一条简洁的跟进消息供我确认，不要自动发送。
```

对比 Offer 时，可以要求 Claude 同时检查固定与浮动薪酬、法定福利、试用期、加班预期、地点、岗位范围、合同主体、竞业条款和待确认问题，而不是只比较月薪数字。

### 第 8 步：从结果中学习并复盘进度

汇总能力缺口：

```text
/china-job-search:upskill all
```

生成本地报告：

```text
/china-job-search:report
```

能力提升通用提示词示例：

```text
分析我的活跃岗位短名单中的能力缺口。区分真正的硬性缺口和可选关键词，按岗位相关性与形成证据所需时间排列学习行动，并设计完成后可以如实写进档案的小型作品成果。
```

报告通用提示词示例：

```text
生成离线求职报告，汇总漏斗转化和待办事项，突出已经逾期的跟进与重复出现的淘汰原因，并避免在报告中暴露敏感网申字段。
```

## 命令速查

| 命令 | 用途 | 示例 |
|---|---|---|
| `/china-job-search:setup` | 创建或重新连接工作区并建立档案 | `/china-job-search:setup /path/to/job-search-cn` |
| `/china-job-search:profile-refresh` | 合并新证据并处理事实冲突 | `/china-job-search:profile-refresh /path/to/resume.pdf` |
| `/china-job-search:search` | 发现、标准化、去重并保存岗位 | `/china-job-search:search 深圳 数据分析 社招` |
| `/china-job-search:rank` | 重新检查资格并排列岗位 | `/china-job-search:rank all` |
| `/china-job-search:apply` | 分析岗位并制作经过审核的申请包 | `/china-job-search:apply <岗位URL>` |
| `/china-job-search:interview` | 生成特定阶段的准备材料 | `/china-job-search:interview <申请ID> technical` |
| `/china-job-search:outcome` | 记录状态、导入结果或起草跟进 | `/china-job-search:outcome <申请ID> followup` |
| `/china-job-search:upskill` | 汇总能力缺口并规划可产出证据的学习 | `/china-job-search:upskill all` |
| `/china-job-search:report` | 生成离线求职看板 | `/china-job-search:report` |
| `/china-job-search:add-template` | 注册自定义文档模板 | `/china-job-search:add-template /path/to/template.tex` |
| `/china-job-search:add-source` | 注册公开岗位来源 | `/china-job-search:add-source https://example.com/careers` |
| `/china-job-search:reset` | 明确确认后重置指定本地数据 | `/china-job-search:reset search` |

## 工作区结构与隐私

初始化命令会创建类似以下结构：

```text
job-search-cn/
├── profile/          # 结构化候选人事实与敏感网申字段
├── jobs/             # 标准化岗位与搜索状态
├── applications/     # 每次申请的独立归档
├── templates/        # 当前使用和自定义的文档模板
├── reports/          # 离线报告
├── tracker.json      # 申请阶段与下一步动作
└── .gitignore        # 默认排除个人求职数据
```

请将工作区保持为私有。在对外发送前，核对姓名、联系方式、日期、量化结果和针对企业填写的答案。非必要时不要保存身份证件图片、银行凭据或账号密码；高度敏感字段应直接填写到经过核验的企业官方表单。

## 自定义

使用 `/china-job-search:add-template` 添加简历或求职信模板。插件会验证占位符，并把副本保存到工作区，不会修改已安装插件。

使用 `/china-job-search:add-source` 添加企业官网、高校就业网或公开招聘页面。添加来源只是记录配置，并不代表获得抓取权限，所有访问边界仍然适用。

## 贡献者验证

在仓库根目录执行：

```bash
python -m unittest discover -s "Claude Code/china-job-search/tests" -v
python /home/hong/.codex/skills/.system/skill-creator/scripts/quick_validate.py "Claude Code/china-job-search/skills/china-job-search"
claude plugin validate "Claude Code/china-job-search"
```

## 上游与许可证

本插件基于 MIT 许可证的 `ai-job-search`，迁移基线为提交 `1cdaf9497f0026fb4de877b80a439af184bce145`。中国版保留上游署名，并用中国大陆的平台边界、隐私要求、招聘轨道和申请习惯替换丹麦专用假设。详见 [LICENSE](./LICENSE)。
