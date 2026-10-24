[English](./README.md)

# DeepSeek Harness 离线语音输入

[详细设计](./docs/design.zh-CN.md)

这个插件在 Harness 输入框的模型选择器与发送按钮之间添加麦克风。点击开始录音，再点击停止；语音在本机转写成文字，写入当前草稿，**不会自动发送**。当前只做“录完再转写”，不显示实时识别结果。

## 设计与流程

1. **加载**：Harness 通过 `dsh.client` 加载浏览器端，宿主端向 Harness 的认证 Connection 注册 `/api/voice.*` 路由。没有额外常驻服务，也不占用固定端口。
2. **一个图标**：输入框里只有麦克风这一个控件。离线识别未就绪时点击它，弹出的是设置卡片而不是开始录音。麦克风带一颗状态灯：可用为绿色，仍需配置为红色，检测中为琥珀色呼吸；悬停麦克风会浮出一张深色提示卡：左侧「听写」，中间一颗状态灯加状态文字，右侧是一个带底色的快捷键文字（如 `Ctrl+Shift+D`）。模型与运行环境检查通过后，同一次点击即可录音。
3. **再次修改设置**：右键（触屏长按）麦克风打开快捷菜单，或从「设置 → 语音设置」进入，两处渲染的是同一个表单。状态行把同一颗状态灯、一行说明和显式的「重新检查」按钮放在一起（快捷菜单里也有同一动作）；重新检查只更新状态灯，不再弹出文字提示。输入框不会多出第二个齿轮图标；工具栏只在录音或转写期间展开，任何提示都不会挤动模型选择器和发送键。
4. **默认安装**：按需创建独立 Python 虚拟环境，并从 sherpa-onnx 官方发布页下载 SenseVoiceSmall INT8 模型。模型与环境存于用户的 XDG 数据目录，不随仓库发布。
5. **可选手动配置**：设置卡会始终显示「当前生效的配置」——模型目录与 Python 可执行文件的实际路径（默认环境也会显示，每行分别标注「已就绪」或「未安装」）。每条路径右侧有两个图标：复制与选择文件夹。路径框本身可编辑；选择即生效，手输的路径点底部的「保存」按钮生效；字段为空时下方会显示插件实际使用的默认路径。Python 选虚拟环境目录时由宿主解析出解释器，找不到就保留所选目录供手动修正。路径只保存到当前用户的配置文件，不写入插件源码。识别语言可设为中文、自动、英语、粤语、日语或韩语。状态行、模型目录、Python 路径旁都有统一的「!」提示，悬停或键盘聚焦即可看到说明。
6. **录音**：浏览器取得麦克风权限，最多录 80 秒；录音期间输入框展开为一条横向录音条：左侧「×」取消本次录音且不转写，中间是波形与计时，右侧「■」结束并转写。录音中按 **Esc** 立即丢弃本次录音，按 **Enter** 结束录音并把转写结果写入草稿（两处都不会自动发送，方便先修改）；点「■」同样只是结束并写入草稿。停录后在浏览器中转换为 16 kHz 单声道 PCM WAV，录音不会上传到互联网。
7. **转写**：WAV 经当前 Harness 的认证本地 API 送到宿主；宿主只在本次请求期间启动 Python 子进程，离线调用 `sherpa_onnx`，收到文字后结束。插件卸载、Harness 退出或请求取消时会终止正在运行的子进程。
8. **写入草稿**：通过 Harness 的 `InputActions.captureInsertion()` 与 `insertText()` 插入一次可撤销编辑。若等待识别期间草稿已变动，结果改为放进浮层提示供复制，避免覆盖新内容。

## 快捷键

插件向 Harness 注册一个名为「听写」的命令（`voice-input.dictate`），快捷键不是插件自建的：它出现在 Harness 的快捷键总表里，与其它命令一起做冲突检测、键帽显示和偏好保存。

- 默认组合：桌面版（含 Linux 桌面）为 `Ctrl/Cmd+Shift+D`，Windows/macOS 的 Web 版相同；Linux Web 版受 Harness 策略限制，只能使用 `Ctrl+Shift+,`。
- 修改方式：在语音设置的「输入」卡片里点击快捷键文字，直接按下新的组合键（Esc 或点击别处取消，改过的组合旁会出现「恢复默认」）；也可以在「设置 → 通用 → 快捷键」里改，两处操作的是同一份配置。
- 录音中按同一组合键即结束并转写；离线语音未就绪时按下它会打开设置卡片。
- Linux Web 只接受 `Ctrl+/`、`Ctrl+Shift+,`、`Ctrl+Shift+.` 三种组合，这是 Harness 对浏览器快捷键的限制，不是插件的选择；桌面应用没有这个限制。

插件的 Web 插槽和草稿 API 见 [Harness 官方输入框文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md)。离线推理示例及模型来源见 [sherpa-onnx SenseVoice 文档](https://k2-fsa.github.io/sherpa/onnx/sense-voice/python-api.html)与[官方 INT8 模型](https://github.com/k2-fsa/sherpa-onnx/blob/master/docs/source/onnx/sense-voice/pretrained.rst)。

## 安装

要求 DeepSeek Harness Web 客户端（已按 `0.2.1-rc.2` 的插件接口实现）、浏览器麦克风权限、Python 3 与 `venv`。首次托管安装需要互联网；之后的录音与识别可离线使用。无 GPU 要求。Linux 桌面启动器可配合使用，但插件本身不依赖启动器。

从仓库根目录运行：

```sh
dsh plugin --profile web add "./DeepSeek Harness/plugins/dsh-client-voice-input"
dsh web
```

打开会话，点击输入框旁的麦克风，再点击“下载并配置离线模型”。初次安装可能需要数分钟和约数百 MB 空间；完成后再次点击麦克风即可录音。既有环境时，直接用每条路径右侧的两个图标：文件夹图标选择目录，复制图标复制路径；也可以直接在路径框里编辑，改完点「保存设置」。修改语言或路径后无需重新下载已有模型。

卸载插件：

```sh
dsh plugin --profile web remove dsh-client-voice-input
```

如需一并删除插件数据，可在退出 Harness 后删除 `$XDG_DATA_HOME/dsh-client-voice-input`（未设置时为 `$HOME/.local/share/dsh-client-voice-input`）和 `$XDG_CONFIG_HOME/dsh-client-voice-input`（未设置时为 `$HOME/.config/dsh-client-voice-input`）。卸载命令本身保留这些用户数据，便于重装。

## 隐私与扩展

运行时录音只经过浏览器、当前 Harness 进程和本机短生命周期识别子进程；模型下载与 Python 依赖安装是首次设置时的唯一网络操作。Harness 的 API 路由要求当前会话的所有者身份，宿主限制 WAV 格式与大小。插件不会调用系统语音服务，也不会自动发送草稿。

职责分层：`lib/core.js` 是引擎注册表（目录名、归档、来源、文件清单、语言）与校验；`lib/store.js` 负责配置的读取与原子写入；`lib/runner.js` 负责子进程与限长读取；`lib/index.js` 只做路由与安装编排；`lib/client.js` 只做录音与界面；`runtime/` 下的两个脚本是引擎适配层。新增识别器 = `ENGINES` 加一条描述 + 两个脚本，路由、设置界面和草稿写入都不用改。当前模型约 228–229 MB；`sherpa_onnx` 加载和识别速度取决于机器性能，首次使用还包括下载及安装时间。

### 可移植性

源码不含任何机器相关路径。模型、虚拟环境与配置按 XDG 惯例推导；设置 `DSH_VOICE_HOME` 可把它们收拢到同一目录（测试与便携安装使用）。手动填写的模型目录与 Python 路径支持 `~/` 展开，其他相对路径会被拒绝。日志、录音、转写结果都不落盘。

| 变量 | 作用 |
| --- | --- |
| `DSH_VOICE_HOME` | 数据与配置收拢到该目录（`data/`、`config.json`）。 |
| `DSH_VOICE_PYTHON` | 托管安装使用的系统 Python，默认 `python3`。 |

## 验证

```sh
cd "DeepSeek Harness/plugins/dsh-client-voice-input"
npm test
node --check lib/index.js
node --check lib/client.js
python3 -m py_compile runtime/setup.py runtime/transcribe.py
```
