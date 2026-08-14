[English](./README.md)

# 效果图目录（images）

本目录集中存放 `dsh-client-ui-usage` 插件的界面效果图（截图），供
[主 README](../README.md) 与文档引用。请遵守以下规范，保证图片长期可维护。

## 目录结构

```
docs/images/
├── README.md          # 本规范（英文）
├── README.zh-CN.md    # 本规范（中文）
├── common/            # 通用截图（中英文文档均可引用）
│   └── brief_view.png
├── en/                # 仅英文界面的截图
│   └── details_en.png
└── zh/                # 仅中文界面的截图
    └── details_zh.png
```

- `common/`：**通用截图**（如简洁显示 `brief_view`），界面元素不依赖语言，
  中英文文档均可引用。
- `en/`：**仅英文界面**的截图，只由英文文档引用。
- `zh/`：**仅中文界面**的截图，只由中文文档引用。

## 命名规范

- 全小写、仅 ASCII，使用下划线分隔单词，例如 `brief_view.png`、
  `details_en.png`。
- 文件名格式：`{视图}[_{locale}].png`。
  - 通用视图**不带语言后缀**，放入 `common/`，如 `brief_view.png`。
  - 语言相关视图**带语言后缀** `_en` / `_zh`，并放入对应语言目录，
    如 `details_en.png`、`details_zh.png`。

## 图片规格

- 格式：PNG（无损）。
- 建议以 2x（DPR）截取，宽度 ≤ 1280px，确保清晰且文件体积可控。
- 截图中必须**隐去敏感信息**：会话内容、密钥、账号标识、内部地址等。
- 同一视图的新截图直接**同名覆盖**，保持 README 中的引用路径不变；
  仅当新增视图时才新增文件。

## 更新流程

1. 使用固定窗口宽度、2x 截取界面。
2. 判断截图是否依赖语言：
   - 通用视图 → 放入 `common/`；
   - 语言相关视图 → 放入 `en/` 或 `zh/`，并按 UI 语言加 `_en` / `_zh` 后缀。
3. 引用时使用相对路径，例如：
   - 通用：`![用量胶囊](./docs/images/common/brief_view.png)`
   - 中文详情：`![详情面板](./docs/images/zh/details_zh.png)`
4. 界面有变化时同名覆盖；如文件名有调整，请同步更新所有引用。
