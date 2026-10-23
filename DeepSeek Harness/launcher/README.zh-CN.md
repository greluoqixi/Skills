[English](./README.md)

# Linux 版 DeepSeek Harness 启动器

从 Linux 应用菜单把 **DeepSeek Harness Web UI** 打开为独立的 Chromium 窗口。关闭窗口后，启动器会结束本次启动的 DSH 服务。这是独立的用户级应用，不捆绑或安装 DSH、Node.js、浏览器，也不管理 DSH 的 API Key。

## 运行条件

- Linux 图形桌面、Python 3 和 Tkinter（许多发行版使用 `python3-tk` 包）。
- [Node.js 22.19+ 或 24+](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)，以及已安装的 [`@deepseek-ai/dsh` 命令行程序](https://github.com/deepseek-ai/deepseek-harness/tree/master/apps/cli)。
- 支持 `--app` 和 `--user-data-dir` 的 Chromium 系浏览器。

请按[官方说明](https://www.deepseek.com/harness/en/)单独安装 DSH；模型和 API Key 仍在 DSH 中配置。

## 使用流程

1. **安装：**在本目录运行 `python3 install.py`，无需 `sudo`。安装程序会输出启动命令的路径，并创建 **DeepSeek Harness** 应用菜单入口。
2. **首次启动：**从应用菜单打开，核对自动发现的 Node、DSH 和浏览器路径。遗漏的项目可用 **Browse** 手动选择，然后点击 **Launch DeepSeek**；所选路径仅为当前用户保存。
3. **日常启动：**再次点击同一图标，会直接打开 DeepSeek。已保存路径在后台检查；若安装位置变化，程序会先重新发现，无法恢复时才显示配置窗口。
4. **修改设置：**先关闭 DeepSeek 窗口，再使用图标的 **Configure DeepSeek Harness** 桌面操作，或运行 `deepseek-harness-launcher --configure`。
5. **检查依赖：**运行 `deepseek-harness-launcher --check`，无需打开图形窗口即可查看发现的路径和缺失项目。

若启动命令不在 `PATH` 中，第 4–5 步请使用安装时输出的完整命令路径。

自动发现覆盖 `PATH`、常见的 nvm/fnm/mise/asdf/Volta Node 位置、npm 和 pnpm 全局命令位置、用户级 DSH 安装，以及已有的 npx 缓存。扫描只检查本地文件，必要时执行 `--version` 或 `npm prefix -g`，不会下载软件。源码安装或特殊布局可手动指定 Node 可执行文件、DSH 命令或 `bin.js`，以及浏览器路径。

## 卸载

先关闭 DeepSeek 窗口，再选择一种方式：

```sh
deepseek-harness-launcher --uninstall
deepseek-harness-launcher --uninstall --keep-data
```

第一条命令移除桌面入口、启动程序、保存的路径配置、专用 Chromium 配置目录和启动器状态。第二条只移除应用程序，保留设置、浏览器配置及启动器状态，便于以后重装。若命令不在 `PATH` 中，使用安装时输出的完整路径。也可以在源码目录运行 `python3 install.py --uninstall`，并按需附加 `--keep-data`。启动器仍在运行时，卸载会拒绝执行。卸载不会删除 DSH、Node.js、浏览器、DSH 会话或 DSH 凭据。

## 文件位置与工作方式

安装程序使用当前用户的 XDG 目录：桌面入口在 `XDG_DATA_HOME/applications`，启动命令在 `XDG_BIN_HOME`，程序文件和专用浏览器配置在 `XDG_DATA_HOME/deepseek-harness-launcher`，保存的设置在 `XDG_CONFIG_HOME/deepseek-harness-launcher`，单实例锁在 `XDG_STATE_HOME/deepseek-harness-launcher`。未设置这些变量时，使用常见的用户级默认目录。源码不包含个人安装路径。

启动器执行 `dsh web --no-open --host 127.0.0.1 --port 0`，读取 DSH 输出的启动地址，只把它传给浏览器。地址内含会话令牌，不会写入日志。DSH 与浏览器使用本次启动的独立进程组；关闭浏览器窗口即结束它们。启动失败时会返回配置窗口并显示诊断。

## 许可证

MIT，见 [LICENSE](./LICENSE)。
