window.__ModuleLoader__.load({
  id: 'dsh-client-voice-input',
  factory: require => {
    const module = { exports: {} };
    const React = require('react');
    const h = React.createElement;
    const NS = 'voice';
    const WAVE_BARS = Array.from({ length: 28 }, (_, index) => index);
    const SHORTCUT_ID = 'voice-input.dictate';
    let directoryPicker = null;
    // The shell's shortcut service; kept module-level so the composer can read
    // the live keycaps and the settings form can edit the same command.
    let shortcutsService = null;
    // Installed by the mounted composer. The shortcut resolver must never hold a
    // stale closure, so it always calls through this module-level indirection.
    let dictateRunner = null;
    const copy = {
      zh: {
        record: '语音输入', stop: '完成并转写', cancel: '取消', recording: '正在录音', transcribing: '正在本地转写…',
        settings: '语音设置', menu: '语音输入菜单', close: '关闭',
        setup: '下载并配置离线模型', settingUp: '正在下载模型并安装本地运行环境…',
        language: '识别语言', save: '保存设置', saved: '设置已保存', checking: '正在检查…',
        dictation: '听写', tipReady: '已就绪', tipNotReady: '未就绪',
        shortcut: '快捷键', shortcutChange: '修改', shortcutReset: '恢复默认', inputSettings: '输入',
        shortcutWaiting: '等待按键…', shortcutUnset: '未设置',
        shortcutCaptureHint: '按下新的组合键；Esc 或点击别处取消。',
        tipShortcut: '点击快捷键即可修改；录音中按同一组合键会结束并转写。',
        shortcutSaved: '快捷键已更新', shortcutResetDone: '快捷键已恢复默认', shortcutUnavailable: '快捷键服务暂不可用',
        shortcutConflict: '这个组合已被其他命令占用，请换一个。', shortcutStale: '快捷键设置在别处已变更，请重试。',
        shortcutIssueReserved: '系统保留了这个组合，请换一个。', shortcutIssueUnsupported: '当前浏览器不接受这个组合，请换一个。',
        shortcutIssueModifier: '至少要包含 Ctrl、Alt 或 Cmd 之一。', shortcutIssueKey: '这个按键不能作为快捷键。',
        shortcutHintLinux: 'Linux 上的 Web 版只允许 Ctrl+/、Ctrl+Shift+,、Ctrl+Shift+. 三种组合；桌面应用没有这个限制。',
        ready: '离线语音已就绪', notReady: '首次使用需配置离线语音',
        runtimeMissing: 'Python 运行环境未就绪',
        failed: '转写失败', empty: '未识别到语音',
        changed: '转写完成，但草稿已改变；请复制文字后自行粘贴。', copy: '复制文字', copied: '已复制',
        permission: '无法使用麦克风，请检查浏览器权限。',
        unsupported: '当前浏览器不支持录音。', cancelled: '已取消录音', reset: '清空手动路径',
        cancelHint: '取消录音（Esc）', stopHint: '结束并转写，文字写入草稿（Enter）',
        menuSettings: '语音设置…', menuRefresh: '重新检查状态',
        helpTitle: '配置帮助',
        helpChecking: '正在检查本机模型与 Python 运行环境…',
        helpUnknown: '还没有拿到状态。点右侧的重新检查再试。',
        helpReady: '离线语音可用：模型与 Python 都在本机运行。点右侧可重新检查，点麦克风开始录音。',
        helpMissing: '还缺：', listSep: '、',
        helpMissingHint: '。点下方按钮自动安装（约 230 MB，只需联网一次）；已有环境可在下方直接填写路径。',
        effective: '当前生效的配置', modelLabel: '模型目录', pythonLabel: 'Python',
        tagMissing: '未安装', tagReady: '已就绪', defaultPath: '默认：',
        hostStale: '宿主没有返回 Python 路径，很可能 Harness 还没重启（客户端会热更新，宿主不会）。请完全退出后重新打开。', copyPath: '复制路径',
        pickFolder: '选择文件夹', updatedModel: '模型目录已更新', updatedPython: 'Python 路径已更新',
        pythonNotFound: '这个目录里没找到 Python。请手动填写解释器绝对路径，或选择包含 bin/python 的虚拟环境目录。',
        copyFailed: '复制失败，可以选中路径后手动复制', resetDone: '已恢复为默认环境',
        noPicker: '当前界面不支持目录选择，请手动填写绝对路径。',
        tipModel: '目录里必须同时有 model.int8.onnx 和 tokens.txt；留空则使用下方显示的默认目录。',
        tipPython: '本地转写由 sherpa-onnx 执行，需要一个装好 sherpa-onnx、numpy 的 Python。可填写解释器绝对路径，或点文件夹图标选择虚拟环境目录，由宿主自动解析；留空则使用下方显示的默认环境。',
      },
      en: {
        record: 'Voice input', stop: 'Finish and transcribe', cancel: 'Cancel', recording: 'Recording', transcribing: 'Transcribing locally…',
        settings: 'Voice settings', menu: 'Voice input menu', close: 'Close',
        setup: 'Download and set up offline model', settingUp: 'Downloading model and installing local runtime…',
        language: 'Recognition language', save: 'Save settings', saved: 'Settings saved', checking: 'Checking…',
        dictation: 'Dictation', tipReady: 'Ready', tipNotReady: 'Not ready',
        shortcut: 'Shortcut', shortcutChange: 'Change', shortcutReset: 'Restore default', inputSettings: 'Input',
        shortcutWaiting: 'Waiting for keys…', shortcutUnset: 'Not set',
        shortcutCaptureHint: 'Press the new combination; Esc or clicking elsewhere cancels.',
        tipShortcut: 'Click the keys to change them; while recording, the same shortcut stops and transcribes.',
        shortcutSaved: 'Shortcut updated', shortcutResetDone: 'Shortcut restored to the default', shortcutUnavailable: 'Shortcuts are unavailable',
        shortcutConflict: 'Another command already uses that combination.', shortcutStale: 'Shortcut preferences changed elsewhere. Try again.',
        shortcutIssueReserved: 'The system reserves that combination.', shortcutIssueUnsupported: 'This browser does not accept that combination.',
        shortcutIssueModifier: 'Include at least one of Ctrl, Alt, or Cmd.', shortcutIssueKey: 'That key cannot be used as a shortcut.',
        shortcutHintLinux: 'The web app on Linux only accepts Ctrl+/, Ctrl+Shift+, and Ctrl+Shift+. The desktop app has no such limit.',
        ready: 'Offline voice is ready', notReady: 'Set up offline voice to begin',
        runtimeMissing: 'Python runtime is missing',
        failed: 'Transcription failed', empty: 'No speech recognized',
        changed: 'Transcription is ready, but the draft changed. Copy and paste the text manually.', copy: 'Copy text', copied: 'Copied',
        permission: 'Microphone unavailable. Check browser permissions.',
        unsupported: 'This browser cannot record audio.', cancelled: 'Recording cancelled', reset: 'Clear manual paths',
        cancelHint: 'Cancel recording (Esc)', stopHint: 'Finish and transcribe into the draft (Enter)',
        menuSettings: 'Voice settings…', menuRefresh: 'Check status again',
        helpTitle: 'Setup help',
        helpChecking: 'Checking the local model and Python runtime…',
        helpUnknown: 'No status yet. Try the re-check button on the right.',
        helpReady: 'Offline speech is ready: the model and Python run locally. Re-check from the right, or click the microphone to record.',
        helpMissing: 'Missing: ', listSep: ', ',
        helpMissingHint: '. Install automatically with the button below (about 230 MB, one network use), or fill in the paths below to reuse an existing environment.',
        effective: 'Effective configuration', modelLabel: 'Model directory', pythonLabel: 'Python',
        tagMissing: 'missing', tagReady: 'ready', defaultPath: 'Default: ',
        hostStale: 'The host did not return a Python path. Harness is probably still running an older host half (client bundles hot-reload, the host does not). Fully quit and reopen it.', copyPath: 'Copy path',
        pickFolder: 'Choose folder', updatedModel: 'Model directory updated', updatedPython: 'Python path updated',
        pythonNotFound: 'No Python found in that folder. Enter the interpreter path manually, or pick the venv folder containing bin/python.',
        copyFailed: 'Copy failed — select the path and copy it manually', resetDone: 'Restored the managed environment',
        noPicker: 'This surface cannot open a directory picker; enter an absolute path manually.',
        tipModel: 'Must contain both model.int8.onnx and tokens.txt. Leave empty to use the default directory shown below.',
        tipPython: 'Transcription runs through sherpa-onnx, so this must be a Python with sherpa-onnx and numpy. Enter the interpreter path, or use the folder button to pick a virtual environment and let the host resolve it. Leave empty to use the managed environment shown below.',
      },
    };
    const css = [
      '.dshv{display:flex;align-items:center;gap:6px;position:relative;font-size:12px;color:var(--dsw-alias-label-primary);min-width:0}',
      '.dshv button,.dshv select,.dshv input{font:inherit}',
      '.dshv-bar{display:flex;align-items:center;gap:10px;flex:1 1 auto;min-width:0}',
      '.dshv-btn{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;padding:6px 10px;cursor:pointer;white-space:nowrap;transition:background .12s ease,border-color .12s ease}',
      '.dshv-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshv-btn:disabled{opacity:.45;cursor:default}',
      '.dshv-btn[data-recording=true]{color:#dc2626;border-color:#dc2626}',
      '.dshv-icon{position:relative;width:30px;height:30px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}',
      '.dshv-icon:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshv-svg{display:block;flex:none}',
      '.dshv-dot{position:absolute;top:3px;right:3px;box-shadow:0 0 0 2px var(--dsw-alias-bg-base,#fff)}',
      '.dshv-time{flex:none;min-width:42px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;letter-spacing:.02em}',
      '.dshv-hint{color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dshv-live{width:100%}',
      '.dshv-live-row{display:flex;align-items:center;gap:10px;width:100%;min-width:0}',
      '.dshv-round{flex:none;width:30px;height:30px;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;line-height:1;padding:0;transition:background .12s ease}',
      '.dshv-round:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshv-round[data-solid=true]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-inverted);border-color:transparent}',
      '.dshv-round[data-solid=true]:hover{background:var(--dsw-alias-button-primary-hover)}',
      '.dshv-wave{flex:1 1 auto;display:flex;align-items:center;justify-content:space-between;gap:2px;min-width:0;height:22px;overflow:hidden}',
      '.dshv-wave i{flex:none;width:4px;height:6px;border-radius:2px;background:var(--dsw-alias-label-caption);transform-origin:center;animation:dshv-wave 1s ease-in-out infinite}',
      '@keyframes dshv-wave{0%,100%{transform:scaleY(.5);opacity:.45}50%{transform:scaleY(1.7);opacity:.9}}',
      '.dshv-spin{display:inline-block;width:10px;height:10px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:dshv-rotate .8s linear infinite}',
      '@keyframes dshv-rotate{to{transform:rotate(360deg)}}',
      '.dshv-pop{position:absolute;right:0;bottom:calc(100% + 10px);z-index:100;width:min(382px,86vw);padding:16px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 16px 40px -12px rgba(0,0,0,.28),0 4px 12px -4px rgba(0,0,0,.16);display:grid;gap:12px;max-height:min(72vh,600px);overflow:auto}',
      '.dshv-head{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.dshv-head h3{margin:0;font-size:14px;font-weight:600;letter-spacing:.01em}',
      '.dshv-x{border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-size:16px;line-height:1;width:24px;height:24px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center}',
      '.dshv-x:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshv-form{display:grid;gap:12px;min-width:0}',
      '.dshv-note{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.55;font-size:12px}',
      '.dshv-note[data-kind=ok]{color:#15803d}',
      '.dshv-note[data-kind=error]{color:#dc2626}',
      '.dshv-note[data-kind=warn]{color:#b45309}',
      '.dshv-status{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--dsw-alias-interactive-bg-hover);font-size:12px}',
      '.dshv-status-text{flex:1 1 auto;min-width:0;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dshv-led{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-tertiary);flex:none}',
      '.dshv-led[data-state=ready]{background:#15803d}',
      '.dshv-led[data-state=notready]{background:#dc2626}',
      '.dshv-led[data-state=checking]{background:#d97706;animation:dshv-pulse 1.3s ease-in-out infinite}',
      '@keyframes dshv-pulse{0%,100%{opacity:.3}50%{opacity:1}}',
      '.dshv-card{display:grid;gap:9px;padding:11px 12px;border-radius:11px;background:var(--dsw-alias-interactive-bg-hover);min-width:0}',
      '.dshv-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.dshv-engine{flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:4px;padding:1px 5px;white-space:nowrap}',
      '.dshv-card-title{font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--dsw-alias-label-caption);text-transform:uppercase}',
      '.dshv-path{display:grid;gap:5px;min-width:0}',
      '.dshv-path-head{display:flex;align-items:center;gap:6px;min-width:0}',
      '.dshv-path-label{flex:none;font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary)}',
      '.dshv-path-tag{flex:none;font-size:9px;font-weight:600;padding:1px 5px;border-radius:4px;border:1px solid currentColor;color:#b45309;white-space:nowrap}',
      '.dshv-path-tag[data-ready=true]{color:#15803d}',
      '.dshv-path-actions{margin-left:auto;display:flex;align-items:center;gap:2px;flex:none}',
      '.dshv-iconbtn{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:0}',
      '.dshv-iconbtn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));color:var(--dsw-alias-label-primary)}',
      '.dshv-iconbtn:disabled{opacity:.35;cursor:default}',
      '.dshv-iconbtn[data-busy=true]{opacity:.85;cursor:default}',
      '.dshv-path .dshv-path-input{width:100%;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:5px 7px}',
      '.dshv-path .dshv-path-input:focus{outline:none;border-color:var(--dsw-alias-label-caption)}',
      '.dshv-path-note{font-size:10px;line-height:1.45;color:var(--dsw-alias-label-tertiary);word-break:break-all}',
      '.dshv-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}',
      '.dshv-row-label{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.dshv-form input,.dshv-form select,.dshv-section input,.dshv-section select{box-sizing:border-box;padding:7px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:inherit;font-size:12px}',
      '.dshv-form input:focus,.dshv-form select:focus,.dshv-section input:focus,.dshv-section select:focus{outline:none;border-color:var(--dsw-alias-label-caption)}',
      '.dshv-form input::placeholder,.dshv-section input::placeholder{color:var(--dsw-alias-label-tertiary)}',
      '.dshv-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:10px;margin-top:2px;border-top:1px solid var(--dsw-alias-border-l2)}',
      // With no secondary action the primary must not look orphaned on the left.
      '.dshv-footer .dshv-button:last-child{margin-left:auto}',
      '.dshv-button{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;transition:background .12s ease,color .12s ease,border-color .12s ease}',
      '.dshv-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dshv-button:disabled{opacity:.4;cursor:default}',
      '.dshv-button[data-variant=primary]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-inverted);border-color:transparent;font-weight:600}',
      '.dshv-button[data-variant=primary]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover);color:var(--dsw-alias-label-primary-inverted)}',
      '.dshv-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-inverted);border-color:transparent;font-weight:600}',
      '.dshv-primary:hover{background:var(--dsw-alias-button-primary-hover);color:var(--dsw-alias-label-primary-inverted)}',
      '.dshv-primary:disabled{opacity:.55}',
      '.dshv-block{width:100%;display:flex;align-items:center;justify-content:center;padding:8px 10px}',
      '.dshv-menu{position:absolute;right:0;bottom:calc(100% + 10px);z-index:110;min-width:200px;padding:5px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2);border-radius:11px;box-shadow:0 14px 32px -10px rgba(0,0,0,.26);display:grid;gap:2px}',
      '.dshv-item{display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:0;background:transparent;color:inherit;padding:7px 9px;border-radius:7px;cursor:pointer;font-size:12px;white-space:nowrap}',
      '.dshv-item-icon{display:inline-flex;color:var(--dsw-alias-label-tertiary)}',
      '.dshv-item:hover .dshv-item-icon{color:var(--dsw-alias-label-primary)}',
      '.dshv-item:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshv-toast{position:absolute;right:0;bottom:calc(100% + 10px);z-index:120;max-width:min(360px,80vw);padding:9px 11px;border-radius:11px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2);box-shadow:0 14px 32px -10px rgba(0,0,0,.26);display:flex;align-items:center;gap:8px;line-height:1.5;font-size:12px}',
      '.dshv-toast[data-kind=error]{border-color:#dc2626}',
      '.dshv-toast[data-kind=error] .dshv-msg{color:#dc2626}',
      '.dshv-toast .dshv-msg{flex:1 1 auto;min-width:0}',
      '.dshv-tip{position:absolute;right:0;bottom:calc(100% + 9px);z-index:130;display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:8px;background:#23262b;color:#f2f4f7;box-shadow:0 10px 26px -10px rgba(0,0,0,.5);font-size:12px;line-height:1.5;white-space:nowrap;pointer-events:none}',
      '.dshv-tip::after{content:"";position:absolute;top:100%;right:14px;border:5px solid transparent;border-top-color:#23262b}',
      '.dshv-tip-title{font-weight:600}',
      '.dshv-tip-state{display:inline-flex;align-items:center;gap:5px;color:#c5c9d0}',
      '.dshv-tip-state .dshv-led[data-state=ready]{background:#34d399}',
      '.dshv-tip-state .dshv-led[data-state=notready]{background:#f87171}',
      '.dshv-tip-state .dshv-led[data-state=checking]{background:#fbbf24}',
      '.dshv-tip-sep{width:1px;height:13px;flex:none;background:rgba(255,255,255,.15)}',
      '.dshv-tip-keys{display:inline-flex;align-items:center;padding:2px 7px;border-radius:6px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.13);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:16px;letter-spacing:.02em;color:#eef1f4;white-space:nowrap}',
      '.dshv-tip-unset{padding:2px 7px;border:1px dashed rgba(255,255,255,.2);border-radius:6px;color:#9aa0a8}',
      '.dshv-shortcut{display:flex;align-items:center;gap:6px;min-width:0}',
      '.dshv-keys-text{display:block;max-width:100%;padding:0 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:16px;letter-spacing:.02em}',
      '.dshv-keys-field{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-height:28px;min-width:86px;max-width:min(240px,100%);padding:2px 4px;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));color:inherit;cursor:pointer;transition:border-color .12s ease,box-shadow .12s ease}',
      '.dshv-keys-field:hover:not(:disabled){border-color:var(--dsw-alias-label-caption)}',
      '.dshv-keys-field:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-alias-border-l2)}',
      '.dshv-keys-field[data-capturing=true]{border-style:dashed;border-color:var(--dsw-alias-label-caption);background:transparent}',
      '.dshv-keys-waiting{display:inline-flex;align-items:center;gap:6px;padding:0 4px;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.dshv-keys-empty{padding:0 6px;font-size:11px;color:var(--dsw-alias-label-tertiary)}',
      '.dshv-pulse{width:6px;height:6px;flex:none;border-radius:50%;background:var(--dsw-alias-label-caption);animation:dshv-pulse 1.2s ease-in-out infinite}',
      '.dshv-row-head{display:flex;align-items:center;gap:6px;min-width:0}',
      '.dshv-shortcut{display:flex;align-items:center;gap:4px;flex:none}',
      '.dshv-section{display:grid;gap:12px;max-width:560px;padding:2px 0 24px}',
      '.dshv-section h2{margin:0;font-size:15px;font-weight:600}',
      '.dshv-help{position:relative;width:16px;height:16px;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-tertiary);font-size:10px;font-weight:700;line-height:1;display:inline-flex;align-items:center;justify-content:center;cursor:help;flex:none;padding:0}',
      '.dshv-help:hover,.dshv-help:focus-visible{border-color:var(--dsw-alias-label-caption);color:var(--dsw-alias-label-primary)}',
      '.dshv-help::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 7px);left:0;width:max-content;max-width:246px;padding:8px 10px;border-radius:9px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2);box-shadow:0 12px 28px -10px rgba(0,0,0,.3);color:var(--dsw-alias-label-primary);font-size:11px;font-weight:400;line-height:1.55;text-align:left;white-space:normal;opacity:0;pointer-events:none;transform:translateY(2px);transition:opacity .12s ease,transform .12s ease;z-index:140}',
      '.dshv-help[data-side=bottom]::after{bottom:auto;top:calc(100% + 7px);transform:translateY(-2px)}',
      '.dshv-help[data-align=end]::after{left:auto;right:0}',
      '.dshv-help:hover::after,.dshv-help:focus-visible::after{opacity:1;transform:none}',
    ].join('');
    const tag = document.createElement('style');
    tag.dataset.pluginCss = 'dsh-client-voice-input';
    tag.textContent = css;
    if (!document.querySelector('style[data-plugin-css="dsh-client-voice-input"]')) document.head.appendChild(tag);

    async function api(path, options) {
      const response = await fetch(`/api/voice.${path}`, options);
      // An unrouted request (stale host half) answers with HTML, not JSON.
      let data = null;
      try { data = await response.json(); } catch { data = null; }
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      return data;
    }

    async function wavFromBlob(blob) {
      const context = new AudioContext();
      try {
        const decoded = await context.decodeAudioData(await blob.arrayBuffer());
        if (!decoded.duration || decoded.duration > 80) throw new Error('Recording must be between 0 and 80 seconds');
        const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
        const source = offline.createBufferSource();
        source.buffer = decoded;
        source.connect(offline.destination);
        source.start();
        const result = await offline.startRendering();
        const samples = result.getChannelData(0);
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        function label(offset, value) { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); }
        label(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); label(8, 'WAVE');
        label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
        view.setUint16(22, 1, true); view.setUint32(24, 16000, true); view.setUint32(28, 32000, true);
        view.setUint16(32, 2, true); view.setUint16(34, 16, true);
        label(36, 'data'); view.setUint32(40, samples.length * 2, true);
        for (let i = 0; i < samples.length; i++) {
          const sample = Math.max(-1, Math.min(1, samples[i]));
          view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
        }
        return buffer;
      } finally { await context.close(); }
    }

    function clock(seconds) {
      const value = Math.max(0, Math.floor(seconds));
      return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    }

    /**
     * Status light shared by the composer microphone and the settings row: green
     * when offline speech is usable, red when it still needs attention, amber
     * while a probe is in flight. Colour carries the state; no text is needed.
     * @param props - state, accessible label, and whether the light overlays a button.
     * @returns the status dot element.
     */
    function StatusDot({ state, label, dot }) {
      return h('span', {
        className: dot ? 'dshv-led dshv-dot' : 'dshv-led',
        'data-state': state, role: 'img', 'aria-label': label,
      });
    }

    /**
     * Read this plugin's row from the shell catalog. The row carries the accepted
     * binding, the device keycaps, and any conflict, so the composer and the
     * settings form never guess what the shortcut currently is.
     * @returns the catalog row, or null before the command is registered.
     */
    function shortcutRow() {
      const rows = shortcutsService?.catalog?.getSnapshot?.() ?? [];
      return rows.find(row => row.id === SHORTCUT_ID) ?? null;
    }

    /**
     * Subscribe a component to catalog changes (bindings are edited in this
     * plugin or in Settings → General → Shortcuts, and both must stay in sync).
     * @returns the current catalog row, or null.
     */
    function useShortcutRow() {
      const [row, setRow] = React.useState(() => shortcutRow());
      React.useEffect(() => {
        const catalog = shortcutsService?.catalog;
        if (!catalog?.subscribe) return undefined;
        const read = () => setRow(shortcutRow());
        read();
        return catalog.subscribe(read);
      }, []);
      return row;
    }

    /** Localized explanation keys for the shell's binding rejection reasons. */
    const ISSUE_TEXT = {
      reserved: 'shortcutIssueReserved',
      'unsupported-browser': 'shortcutIssueUnsupported',
      'modifier-required': 'shortcutIssueModifier',
      'unsupported-key': 'shortcutIssueKey',
    };

    /**
     * One readable string for a binding: keys joined with plus signs, never a row
     * of separate chips. The shell already localizes the key names per platform.
     * @param row - catalog row, or null.
     * @returns e.g. "Ctrl+Shift+D", or an empty string when unbound.
     */
    function shortcutText(row) {
      const keys = row?.keys ?? [];
      return keys.filter(key => key !== '+' && key !== ' ').join('+');
    }

    /** Keycaps for a usable binding; empty when it is unbound or rejected. */
    function shortcutKeys(row) {
      if (!row || row.binding === null || row.issue !== null) return [];
      if ((row.conflicts?.length ?? 0) > 0) return [];
      return row.keys ?? [];
    }

    /**
     * One stroke geometry shared by every plugin icon: 24-unit grid, round caps,
     * currentColor. Keeping them inline avoids platform emoji fonts and keeps the
     * weight identical to the surrounding Harness controls.
     * @param size - rendered edge length in pixels.
     * @param className - optional extra class names.
     * @param children - SVG shape nodes.
     * @returns the SVG element.
     */
    function svgIcon(size, className, children) {
      return h('svg', {
        className: className ? `dshv-svg ${className}` : 'dshv-svg',
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true', focusable: 'false',
      }, children);
    }

    const Icon = {
      mic: (size = 18) => svgIcon(size, null, [
        h('rect', { key: 'body', x: 9, y: 2.5, width: 6, height: 11, rx: 3 }),
        h('path', { key: 'arc', d: 'M5 11v.6a7 7 0 0 0 14 0V11' }),
        h('path', { key: 'stem', d: 'M12 18.6V21' }),
      ]),
      close: (size = 16) => svgIcon(size, null, [
        h('path', { key: 'a', d: 'M17 7 7 17' }),
        h('path', { key: 'b', d: 'M7 7l10 10' }),
      ]),
      stop: (size = 14) => h('svg', {
        className: 'dshv-svg', width: size, height: size, viewBox: '0 0 24 24',
        'aria-hidden': 'true', focusable: 'false',
      }, h('rect', { x: 6.5, y: 6.5, width: 11, height: 11, rx: 3, fill: 'currentColor' })),
      copy: (size = 13) => svgIcon(size, null, [
        h('rect', { key: 'front', x: 9, y: 9, width: 11, height: 11, rx: 2.5 }),
        h('path', { key: 'back', d: 'M15 5.6A1.6 1.6 0 0 0 13.4 4H5.6A1.6 1.6 0 0 0 4 5.6v7.8A1.6 1.6 0 0 0 5.6 15' }),
      ]),
      check: (size = 14) => svgIcon(size, null, [
        h('path', { key: 'a', d: 'm5 12.5 4.5 4.5L19 7' }),
      ]),
      folder: (size = 15) => svgIcon(size, null, [
        h('path', { key: 'a', d: 'M3 7.6A1.6 1.6 0 0 1 4.6 6h4.1l1.9 2.1h8.8A1.6 1.6 0 0 1 21 9.7v7.7a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.4V7.6Z' }),
      ]),
      save: (size = 16) => svgIcon(size, null, [
        h('path', { key: 'body', d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z' }),
        h('path', { key: 'flap', d: 'M17 21v-8H7v8' }),
        h('path', { key: 'label', d: 'M7 3v5h8' }),
      ]),
      reset: (size = 16) => svgIcon(size, null, [
        h('path', { key: 'arrow', d: 'M3 12a9 9 0 1 0 3-6.7L3 8' }),
        h('path', { key: 'head', d: 'M3 3v5h5' }),
      ]),
      refresh: (size = 15) => svgIcon(size, null, [
        h('path', { key: 'arrow', d: 'M21 12a9 9 0 1 1-3-6.7L21 8' }),
        h('path', { key: 'head', d: 'M21 3v5h-5' }),
      ]),
      settings: (size = 15) => svgIcon(size, null, [
        h('path', { key: 'gear', d: 'M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z' }),
        h('circle', { key: 'core', cx: 12, cy: 12, r: 3 }),
      ]),
    };

    const LANGUAGES = [['zh', '中文'], ['auto', 'Auto'], ['en', 'English'], ['yue', '粤语'], ['ja', '日本語'], ['ko', '한국어']];

    /**
     * Copy without assuming the Clipboard API is available: the async path covers
     * modern browsers, the textarea fallback covers embedded views that deny it.
     * @param text - value to copy.
     * @returns whether the copy succeeded.
     */
    async function writeClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        try {
          const area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.top = '-1000px';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          const ok = document.execCommand('copy');
          area.remove();
          return ok;
        } catch { return false; }
      }
    }

    /**
     * Shared status/configuration form. It backs both the toolbar popover and the
     * Settings-center section so the two surfaces can never drift apart. It always
     * shows the effective model and Python paths, even while the managed defaults
     * own them, so a first-time user can see exactly what the plugin will use.
     * @param props - translator, surface variant, close/status callbacks, and the
     * optional workspace directory picker.
     * @returns the configuration form element.
     */
    function SettingsForm({ t, variant, onClose, onStatus, initialStatus, pickDirectory }) {
      const inline = variant === 'section';
      const [status, setStatus] = React.useState(initialStatus ?? null);
      const [form, setForm] = React.useState(() => (initialStatus?.config
        ? { modelDir: initialStatus.config.modelDir, python: initialStatus.config.python }
        : { modelDir: '', python: '' }));
      const [busy, setBusy] = React.useState(false);
      const [settingUp, setSettingUp] = React.useState(false);
      const [checking, setChecking] = React.useState(!initialStatus);
      const [note, setNote] = React.useState(null);
      const [capturing, setCapturing] = React.useState(false);
      const [shortcutNote, setShortcutNote] = React.useState(null);
      const keyField = React.useRef(null);
      const [copied, setCopied] = React.useState('');
      const alive = React.useRef(true);
      const copyTimer = React.useRef(null);
      React.useEffect(() => () => { alive.current = false; clearTimeout(copyTimer.current); }, []);

      const shortcut = useShortcutRow();
      const ready = !!(status?.modelReady && status?.runtimeReady);
      const light = checking ? 'checking' : ready ? 'ready' : 'notready';
      const statusLabel = checking ? t('checking') : ready ? t('ready') : t('notReady');
      // The hint is rebuilt from the live state on every render, so it can never
      // keep describing a previous configuration.
      const statusHelp = checking
        ? t('helpChecking')
        : !status
          ? t('helpUnknown')
          : ready
            ? t('helpReady')
            : `${t('helpMissing')}${[
              status.modelReady ? null : t('modelLabel'),
              status.runtimeReady ? null : t('pythonLabel'),
            ].filter(Boolean).join(t('listSep'))}${t('helpMissingHint')}`;
      const savedModel = status?.config?.modelDir ?? '';
      const savedPython = status?.config?.python ?? '';
      const modelPath = status?.modelDir || status?.defaults?.modelDir || '';
      const pythonPath = status?.python || status?.defaults?.python || '';
      const dirty = form.modelDir !== savedModel || form.python !== savedPython;
      const showReset = !!(savedModel || savedPython || form.modelDir || form.python);
      // Older host halves do not report the resolved interpreter; say so instead of
      // leaving the Python row silently blank.
      const staleHost = !!status && !status.python && !status.defaults?.python;

      async function refresh() {
        try {
          const next = await api('status');
          if (!alive.current) return null;
          setStatus(next);
          setForm({ modelDir: next.config.modelDir, python: next.config.python });
          onStatus?.(next);
          return next;
        } catch (error) {
          if (!alive.current) return null;
          const stale = /HTTP 404/.test(error.message);
          setNote({ kind: 'error', text: stale ? t('hostStale') : error.message });
          return null;
        }
      }

      // An already-known status avoids a spinner flash; the probe still runs so
      // an outdated host answer is corrected.
      React.useEffect(() => { if (initialStatus) refresh(); else recheck(); }, []);

      async function recheck() {
        setChecking(true);
        try { await refresh(); } finally { if (alive.current) setChecking(false); }
      }

      async function apply(patch, message) {
        setBusy(true); setNote(null);
        try {
          await api('config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
          const next = await refresh();
          if (next && message) setNote({ kind: 'ok', text: message });
        } catch (error) { if (alive.current) setNote({ kind: 'error', text: error.message }); }
        finally { if (alive.current) setBusy(false); }
      }

      // A rejected combination keeps the recorder open so the user can try again
      // without reopening it; only a successful save closes the recorder.
      async function saveShortcut(binding) {
        if (!shortcutsService) { setShortcutNote({ kind: 'error', text: t('shortcutUnavailable') }); return; }
        let described;
        try { described = shortcutsService.describeBinding(binding); } catch { described = null; }
        if (!described) { setShortcutNote({ kind: 'error', text: t('shortcutIssueKey') }); return; }
        if (described.issue) {
          setShortcutNote({ kind: 'error', text: t(ISSUE_TEXT[described.issue] ?? 'shortcutIssueKey') });
          return;
        }
        if (described.conflicts.length > 0) { setShortcutNote({ kind: 'error', text: t('shortcutConflict') }); return; }
        const config = shortcutsService.config.getSnapshot();
        if (config.status !== 'ready') { setShortcutNote({ kind: 'error', text: t('shortcutUnavailable') }); return; }
        setBusy(true);
        try {
          const result = await shortcutsService.edit({ type: 'set', id: SHORTCUT_ID, binding: described.binding }, config.revision);
          if (!alive.current) return;
          if (result.status === 'saved') {
            setShortcutNote({ kind: 'ok', text: t('shortcutSaved') });
            setCapturing(false);
          } else if (result.issue) {
            setShortcutNote({ kind: 'error', text: t(ISSUE_TEXT[result.issue] ?? 'shortcutIssueKey') });
          } else if (result.conflicts?.length) {
            setShortcutNote({ kind: 'error', text: t('shortcutConflict') });
          } else {
            setShortcutNote({ kind: 'error', text: t('shortcutStale') });
          }
        } catch (error) {
          if (alive.current) setShortcutNote({ kind: 'error', text: error.message || t('shortcutStale') });
        } finally { if (alive.current) setBusy(false); }
      }

      async function resetShortcut() {
        if (!shortcutsService) return;
        const config = shortcutsService.config.getSnapshot();
        if (config.status !== 'ready') { setShortcutNote({ kind: 'error', text: t('shortcutUnavailable') }); return; }
        setBusy(true);
        try {
          const result = await shortcutsService.edit({ type: 'reset', id: SHORTCUT_ID }, config.revision);
          if (!alive.current) return;
          setShortcutNote(result.status === 'saved'
            ? { kind: 'ok', text: t('shortcutResetDone') }
            : { kind: 'error', text: t('shortcutStale') });
        } catch (error) {
          if (alive.current) setShortcutNote({ kind: 'error', text: error.message || t('shortcutStale') });
        } finally { if (alive.current) setBusy(false); }
      }

      React.useEffect(() => {
        if (!capturing) return undefined;
        if (shortcutsService?.runtime === 'desktop') {
          try { shortcutsService.recording(true).catch(() => {}); } catch { /* No native bridge. */ }
        }
        const onKeyDown = event => {
          if (event.isComposing || event.repeat) return;
          if (event.key === 'Escape' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            setCapturing(false);
            setShortcutNote(null);
            return;
          }
          if (event.getModifierState?.('AltGraph')) return;
          if (/^(Control|Alt|Shift|Meta)(Left|Right)$/u.test(event.code)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          const modifiers = [];
          if (event.ctrlKey) modifiers.push('control');
          if (event.altKey) modifiers.push('alt');
          if (event.shiftKey) modifiers.push('shift');
          if (event.metaKey) modifiers.push('meta');
          saveShortcut({ code: event.code, modifiers });
        };
        const onBlur = () => { setCapturing(false); setShortcutNote(null); };
        const onPointerDown = event => {
          if (keyField.current && !keyField.current.contains(event.target)) setCapturing(false);
        };
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('mousedown', onPointerDown);
        window.addEventListener('blur', onBlur);
        return () => {
          document.removeEventListener('keydown', onKeyDown, true);
          document.removeEventListener('mousedown', onPointerDown);
          window.removeEventListener('blur', onBlur);
          if (shortcutsService?.runtime === 'desktop') {
            try { shortcutsService.recording(false).catch(() => {}); } catch { /* No native bridge. */ }
          }
        };
      }, [capturing]);

      async function setup() {
        setSettingUp(true); setNote(null);
        try {
          await api('setup', { method: 'POST' });
          const next = await refresh();
          if (!alive.current) return;
          setNote(next?.modelReady && next?.runtimeReady
            ? { kind: 'ok', text: t('ready') }
            : { kind: 'error', text: t('runtimeMissing') });
        } catch (error) { if (alive.current) setNote({ kind: 'error', text: error.message }); }
        finally { if (alive.current) setSettingUp(false); }
      }

      async function chooseFolder() {
        if (typeof pickDirectory !== 'function') { setNote({ kind: 'error', text: t('noPicker') }); return null; }
        try { return await pickDirectory(); }
        catch (error) { if (alive.current) setNote({ kind: 'error', text: error.message }); return null; }
      }

      async function pickModel() {
        const picked = await chooseFolder();
        if (picked) await apply({ modelDir: picked }, t('updatedModel'));
      }

      async function pickPython() {
        const picked = await chooseFolder();
        if (!picked) return;
        try {
          const resolved = await api('resolve-python', { method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ dir: picked }) });
          if (resolved.path) await apply({ python: resolved.path }, t('updatedPython'));
          else {
            setForm(current => ({ ...current, python: picked }));
            setNote({ kind: 'warn', text: t('pythonNotFound') });
          }
        } catch (error) { if (alive.current) setNote({ kind: 'error', text: error.message }); }
      }

      async function copy(key, value) {
        if (!value) return;
        const ok = await writeClipboard(value);
        if (!ok) { setNote({ kind: 'error', text: t('copyFailed') }); return; }
        setCopied(key);
        clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => { if (alive.current) setCopied(''); }, 1600);
      }

      function help(tip, label, extra = {}) {
        const attrs = { type: 'button', className: 'dshv-help', 'data-tip': tip, 'aria-label': label };
        if (extra.side) attrs['data-side'] = extra.side;
        if (extra.align) attrs['data-align'] = extra.align;
        return h('button', attrs, '!');
      }

      function tag(label, ready) {
        return h('span', { className: 'dshv-path-tag', 'data-ready': ready }, label);
      }

      function pathRow(options) {
        const { key, label, tip, value, fallback, installed, onEdit, onPick } = options;
        const effective = value || fallback || '';
        return h('div', { className: 'dshv-path' },
          h('div', { className: 'dshv-path-head' },
            h('span', { className: 'dshv-path-label' }, label),
            help(tip, label),
            tag(installed ? t('tagReady') : t('tagMissing'), installed),
            h('span', { className: 'dshv-path-actions' },
              h('button', { type: 'button', className: 'dshv-iconbtn', title: t('copyPath'), 'aria-label': t('copyPath'),
                disabled: !effective, onClick: () => copy(key, effective) },
                copied === key ? Icon.check(14) : Icon.copy(14)),
              h('button', { type: 'button', className: 'dshv-iconbtn', title: t('pickFolder'), 'aria-label': t('pickFolder'),
                disabled: busy, onClick: onPick }, Icon.folder(14)))),
          h('input', { className: 'dshv-path-input', value, disabled: busy,
            'aria-label': label, onChange: event => onEdit(event.target.value) }),
          !value && fallback && h('span', { className: 'dshv-path-note' }, `${t('defaultPath')}${fallback}`));
      }

      const busyAll = busy || settingUp;
      return h('div', { className: inline ? 'dshv-section' : 'dshv-form' },
        !inline && h('div', { className: 'dshv-head' },
          h('h3', null, t('settings')),
          h('button', { type: 'button', className: 'dshv-x', onClick: onClose, 'aria-label': t('close'), title: t('close') }, Icon.close(15))),
        inline && h('h2', null, t('settings')),
        h('div', { className: 'dshv-status' },
          h(StatusDot, { state: light, label: statusLabel }),
          h('span', { className: 'dshv-status-text' }, statusLabel),
          h('button', { type: 'button', className: 'dshv-iconbtn', title: t('menuRefresh'), 'aria-label': t('menuRefresh'),
            disabled: checking, 'data-busy': checking, onClick: recheck },
            checking ? h('span', { className: 'dshv-spin' }) : Icon.refresh(14)),
          help(statusHelp, t('helpTitle'), { side: 'bottom', align: 'end' })),
        !ready && !checking && status && h('button', { type: 'button', className: 'dshv-btn dshv-primary dshv-block',
          disabled: busyAll, onClick: setup }, settingUp ? t('settingUp') : t('setup')),
        h('div', { className: 'dshv-card' },
          h('div', { className: 'dshv-card-head' },
            h('span', { className: 'dshv-card-title' }, t('effective')),
            status?.engine?.label && h('span', { className: 'dshv-engine' }, status.engine.label)),
          pathRow({ key: 'model', label: t('modelLabel'), tip: t('tipModel'), value: form.modelDir,
            fallback: modelPath, installed: !!status?.modelReady,
            onEdit: value => setForm(current => ({ ...current, modelDir: value })), onPick: pickModel }),
          pathRow({ key: 'python', label: t('pythonLabel'), tip: t('tipPython'), value: form.python,
            fallback: pythonPath, installed: !!status?.runtimeReady,
            onEdit: value => setForm(current => ({ ...current, python: value })), onPick: pickPython })),
        h('div', { className: 'dshv-card' },
          h('div', { className: 'dshv-card-head' },
            h('span', { className: 'dshv-card-title' }, t('inputSettings'))),
          h('div', { className: 'dshv-row' },
            h('span', { className: 'dshv-row-label' }, t('language')),
            h('select', { value: status?.config?.language ?? 'zh', disabled: busyAll || capturing, 'aria-label': t('language'),
              onChange: event => apply({ language: event.target.value }) },
              LANGUAGES.map(([value, label]) => h('option', { key: value, value }, label)))),
          shortcut && h('div', { className: 'dshv-row' },
            h('div', { className: 'dshv-row-head' },
              h('span', { className: 'dshv-row-label' }, t('shortcut')),
              help(t('tipShortcut'), t('shortcut'), { side: 'bottom' })),
            h('div', { className: 'dshv-shortcut' },
              h('button', {
                type: 'button', className: 'dshv-keys-field', ref: keyField,
                'data-capturing': capturing,
                title: capturing ? t('shortcutCaptureHint') : t('shortcutChange'),
                'aria-label': capturing
                  ? t('shortcutCaptureHint')
                  : `${t('shortcut')} ${(shortcut.keys?.length ?? 0) > 0 ? shortcutText(shortcut) : t('shortcutUnset')}`,
                disabled: busyAll,
                onClick: () => { setCapturing(value => !value); setShortcutNote(null); },
              },
                capturing
                  ? h('span', { className: 'dshv-keys-waiting' },
                    h('span', { className: 'dshv-pulse', 'aria-hidden': 'true' }),
                    t('shortcutWaiting'))
                  : ((shortcut.keys?.length ?? 0) > 0
                    ? h('span', { className: 'dshv-keys-text' }, shortcutText(shortcut))
                    : h('span', { className: 'dshv-keys-empty' }, t('shortcutUnset')))),
              !capturing && shortcut.modified && h('button', {
                type: 'button', className: 'dshv-iconbtn', title: t('shortcutReset'), 'aria-label': t('shortcutReset'),
                disabled: busyAll, onClick: resetShortcut }, Icon.reset(14)))),
          capturing && h('p', { className: 'dshv-note' }, t('shortcutCaptureHint')),
          capturing && shortcutsService?.runtime === 'web' && shortcutsService?.platform === 'linux'
            && h('p', { className: 'dshv-note' }, t('shortcutHintLinux')),
          !capturing && shortcut?.issue && h('p', { className: 'dshv-note', 'data-kind': 'warn' },
            t(ISSUE_TEXT[shortcut.issue] ?? 'shortcutIssueKey')),
          !capturing && (shortcut?.conflicts?.length ?? 0) > 0 && h('p', { className: 'dshv-note', 'data-kind': 'warn' },
            t('shortcutConflict')),
          shortcutNote && h('p', { className: 'dshv-note', 'data-kind': shortcutNote.kind, role: 'status' }, shortcutNote.text)),
        staleHost && h('p', { className: 'dshv-note', 'data-kind': 'warn', role: 'status' }, t('hostStale')),
        note && h('p', { className: 'dshv-note', 'data-kind': note.kind, role: 'status' }, note.text),
        h('div', { className: 'dshv-footer' },
          // Only offer "clear" when there is something to clear; a permanently
          // greyed button reads as broken rather than as "not applicable".
          showReset && h('button', { type: 'button', className: 'dshv-button', 'data-variant': 'ghost',
            disabled: busyAll,
            onClick: () => apply({ modelDir: '', python: '' }, t('resetDone')) },
            Icon.reset(15), t('reset')),
          h('button', { type: 'button', className: 'dshv-button', 'data-variant': dirty ? 'primary' : 'ghost',
            disabled: busyAll,
            onClick: () => (dirty
              ? apply({ modelDir: form.modelDir, python: form.python }, t('saved'))
              : setNote({ kind: 'ok', text: t('saved') })) },
            Icon.save(15), t('save'))));
    }

    /**
     * Composer activity occupant: one microphone that both configures and records.
     * It expands the toolbar only while recording or transcribing, so settings and
     * errors never push the model selector or the send button around.
     * @param props - slot-owned lock flag, expansion callback, draft actions, and translator.
     * @returns the toolbar control element.
     */
    function VoiceInput({ locked, onActiveChange, inputActions, t }) {
      const [phase, setPhase] = React.useState('idle');
      const [panel, setPanel] = React.useState(false);
      const [menu, setMenu] = React.useState(false);
      const [toast, setToast] = React.useState(null);
      const [elapsed, setElapsed] = React.useState(0);
      const [status, setStatus] = React.useState(null);
      const [checking, setChecking] = React.useState(true);
      const root = React.useRef(null);
      const recorder = React.useRef(null);
      const stream = React.useRef(null);
      const insertion = React.useRef(null);
      const controller = React.useRef(null);
      const timer = React.useRef(null);
      const ticker = React.useRef(null);
      const toastTimer = React.useRef(null);
      const hoverTimer = React.useRef(null);
      const latestToggle = React.useRef(null);
      const mounted = React.useRef(true);
      const recording = phase === 'recording';
      const transcribing = phase === 'transcribing';
      const ready = !!(status?.modelReady && status?.runtimeReady);
      const light = checking ? 'checking' : ready ? 'ready' : 'notready';
      const shortcut = useShortcutRow();
      const keycaps = shortcutKeys(shortcut);
      const [hover, setHover] = React.useState(false);

      React.useEffect(() => {
        mounted.current = true;
        check();
        return () => {
          mounted.current = false;
          controller.current?.abort();
          clearTimeout(timer.current);
          clearInterval(ticker.current);
          clearTimeout(toastTimer.current);
          clearTimeout(hoverTimer.current);
          if (recorder.current?.state === 'recording') recorder.current.stop();
          stream.current?.getTracks().forEach(track => track.stop());
          onActiveChange(false);
        };
      }, []);

      React.useEffect(() => { onActiveChange(recording || transcribing); }, [recording, transcribing, onActiveChange]);

      // A take replaces the control; never resurrect the hover card afterwards
      // just because the pointer never left the button.
      React.useEffect(() => { if (recording || transcribing) setHover(false); }, [recording, transcribing]);

      // Keyboard while a take is live: Esc discards it, Enter finishes it and
      // leaves the transcript in the draft so the user can edit before sending.
      React.useEffect(() => {
        if (!recording && !transcribing) return undefined;
        const onKeyDown = event => {
          if (event.isComposing || event.repeat || event.keyCode === 229) return;
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
            return;
          }
          if (event.key === 'Enter' && !event.shiftKey && recording) {
            event.preventDefault();
            event.stopPropagation();
            finish();
          }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
      }, [recording, transcribing]);

      React.useEffect(() => {
        if (!toast) return undefined;
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), toast.kind === 'error' ? 7000 : 3500);
        return () => clearTimeout(toastTimer.current);
      }, [toast]);

      React.useEffect(() => {
        if (!menu && !panel) return undefined;
        const onPointerDown = event => {
          if (root.current && !root.current.contains(event.target)) { setMenu(false); setPanel(false); }
        };
        const onKeyDown = event => { if (event.key === 'Escape') { setMenu(false); setPanel(false); } };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
          document.removeEventListener('mousedown', onPointerDown);
          document.removeEventListener('keydown', onKeyDown);
        };
      }, [menu, panel]);

      function say(text, kind = 'info', action = null) { setToast({ text, kind, action }); }

      async function refresh() {
        try {
          const next = await api('status');
          if (mounted.current) setStatus(next);
          return next;
        } catch (error) { if (mounted.current) say(error.message, 'error'); return null; }
      }

      // Re-probe without producing a message: the status light is the feedback.
      async function check() {
        setChecking(true);
        try { await refresh(); } finally { if (mounted.current) setChecking(false); }
      }

      function stopTracks() {
        stream.current?.getTracks().forEach(track => track.stop());
        stream.current = null;
      }

      function settle() {
        clearTimeout(timer.current);
        clearInterval(ticker.current);
        setElapsed(0);
      }

      async function copyText(text) {
        try { await navigator.clipboard.writeText(text); say(t('copied')); }
        catch (error) { say(error.message || t('failed'), 'error'); }
      }

      async function start() {
        setToast(null); setMenu(false);
        let current = status ?? await refresh();
        if (!current?.modelReady || !current?.runtimeReady) { setPanel(true); return; }
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { say(t('unsupported'), 'error'); return; }
        try {
          insertion.current = inputActions.captureInsertion();
          const audio = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          if (!mounted.current) { audio.getTracks().forEach(track => track.stop()); return; }
          stream.current = audio;
          const chunks = [];
          const next = new MediaRecorder(audio);
          next.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
          next.onstop = async () => {
            stopTracks(); settle();
            if (!mounted.current) return;
            setPhase('transcribing');
            const abort = new AbortController();
            controller.current = abort;
            try {
              const wav = await wavFromBlob(new Blob(chunks, { type: next.mimeType }));
              const data = await api('transcribe', { method: 'POST', body: wav,
                headers: { 'content-type': 'audio/wav' }, signal: abort.signal });
              if (!mounted.current) return;
              if (!data.text) say(t('empty'), 'warn');
              else if (!inputActions.insertText(data.text, insertion.current)) {
                say(t('changed'), 'warn', { label: t('copy'), run: () => copyText(data.text) });
              }
            } catch (error) {
              if (mounted.current && !abort.signal.aborted) say(`${t('failed')}: ${error.message}`, 'error');
            } finally {
              if (mounted.current) { setPhase('idle'); controller.current = null; }
            }
          };
          recorder.current = next;
          next.start(250);
          setElapsed(0);
          setPhase('recording');
          ticker.current = setInterval(() => setElapsed(value => value + 1), 1000);
          timer.current = setTimeout(() => { if (next.state === 'recording') next.stop(); }, 80_000);
        } catch (error) {
          stopTracks();
          say(`${t('permission')} ${error.message || ''}`, 'error');
        }
      }

      function finish() {
        if (recorder.current?.state === 'recording') recorder.current.stop();
      }

      function cancel() {
        controller.current?.abort();
        const active = recorder.current;
        if (active?.state === 'recording') { active.onstop = null; active.stop(); }
        stopTracks(); settle();
        setPhase('idle');
        say(t('cancelled'));
      }

      function toggle() {
        if (recording) finish();
        else if (transcribing) cancel();
        else start();
      }

      // The registered command calls the newest toggle; the ref update runs after
      // every render so the resolver never captures a stale phase.
      React.useEffect(() => { latestToggle.current = toggle; });
      React.useEffect(() => {
        dictateRunner = () => latestToggle.current?.();
        return () => { dictateRunner = null; };
      }, []);

      function showTip() {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => { if (mounted.current) setHover(true); }, 140);
      }

      function hideTip() {
        clearTimeout(hoverTimer.current);
        setHover(false);
      }

      function openMenu(event) {
        event.preventDefault();
        hideTip();
        setPanel(false);
        setMenu(value => !value);
      }

      if (recording || transcribing) {
        return h('div', { className: 'dshv dshv-live', ref: root },
          h('div', { className: 'dshv-live-row', role: 'group', 'aria-label': recording ? t('recording') : t('transcribing') },
            h('button', { type: 'button', className: 'dshv-round', title: t('cancelHint'), 'aria-label': t('cancel'),
              onClick: cancel }, Icon.close(15)),
            recording && h('div', { className: 'dshv-wave', 'aria-hidden': 'true' },
              WAVE_BARS.map(index => h('i', {
                key: index,
                style: { animationDelay: `${(index % 7) * 90}ms`, height: `${5 + ((index * 5) % 9)}px` },
              }))),
            transcribing && h('span', { className: 'dshv-spin' }),
            transcribing && h('span', { className: 'dshv-hint', style: { flex: '1 1 auto' } }, t('transcribing')),
            recording && h('span', { className: 'dshv-time' }, clock(elapsed)),
            recording && h('button', { type: 'button', className: 'dshv-round', 'data-solid': 'true',
              title: t('stopHint'), 'aria-label': t('stop'), onClick: finish }, Icon.stop(13))),
          toast && h('div', { className: 'dshv-toast', 'data-kind': toast.kind, role: 'status', 'aria-live': 'polite' },
            h('span', { className: 'dshv-msg' }, toast.text),
            toast.action && h('button', { type: 'button', className: 'dshv-btn', onClick: toast.action.run }, toast.action.label)));
      }

      const statusLabel = light === 'checking' ? t('checking') : ready ? t('ready') : t('notReady');
      const tipStatus = light === 'checking' ? t('checking') : ready ? t('tipReady') : t('tipNotReady');
      const micLabel = ready ? t('record') : t('settings');
      const micTitle = `${micLabel} · ${statusLabel}${keycaps.length ? ` · ${shortcut?.aria || shortcutText(shortcut)}` : ''}`;
      return h('div', { className: 'dshv', ref: root },
        h('div', { className: 'dshv-bar', onContextMenu: openMenu },
          h('button', {
            type: 'button', className: 'dshv-btn dshv-icon',
            disabled: locked,
            'aria-label': micTitle, 'aria-haspopup': 'menu',
            onClick: toggle,
            onMouseEnter: showTip, onMouseLeave: hideTip,
            onFocus: () => { clearTimeout(hoverTimer.current); setHover(true); },
            onBlur: hideTip,
          },
            Icon.mic(18),
            h(StatusDot, { dot: true, state: light, label: statusLabel }))),
        hover && !panel && !menu && h('div', { className: 'dshv-tip', role: 'tooltip' },
          h('span', { className: 'dshv-tip-title' }, t('dictation')),
          h('span', { className: 'dshv-tip-state' },
            h(StatusDot, { state: light, label: tipStatus }),
            h('span', null, tipStatus)),
          keycaps.length > 0 && h('span', { className: 'dshv-tip-sep', 'aria-hidden': 'true' }),
          keycaps.length
            ? h('span', { className: 'dshv-tip-keys' }, shortcutText(shortcut))
            : h('span', { className: 'dshv-tip-unset' }, t('shortcutUnset'))),
        toast && !panel && h('div', { className: 'dshv-toast', 'data-kind': toast.kind, role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'dshv-msg' }, toast.text),
          toast.action && h('button', { type: 'button', className: 'dshv-btn', onClick: toast.action.run }, toast.action.label)),
        menu && h('div', { className: 'dshv-menu', role: 'menu', 'aria-label': t('menu') },
          h('button', { type: 'button', className: 'dshv-item', role: 'menuitem',
            onClick: () => { setMenu(false); setPanel(true); } },
            h('span', { className: 'dshv-item-icon' }, Icon.settings(15)),
            h('span', { className: 'dshv-item-label' }, t('menuSettings'))),
          h('button', { type: 'button', className: 'dshv-item', role: 'menuitem',
            onClick: () => { setMenu(false); check(); } },
            h('span', { className: 'dshv-item-icon' }, Icon.refresh(15)),
            h('span', { className: 'dshv-item-label' }, t('menuRefresh')))),
        panel && h('div', { className: 'dshv-pop', role: 'dialog', 'aria-label': t('settings') },
          h(SettingsForm, { t, variant: 'panel', onClose: () => setPanel(false), onStatus: setStatus, initialStatus: status, pickDirectory: directoryPicker })));
    }

    /**
     * Settings-center surface. It reuses the toolbar form so both entry points
     * expose exactly the same configuration and status semantics.
     * @param props - injected translator, directory picker, and the shell's close callback.
     * @returns the settings section element.
     */
    function VoiceSettingsSection({ t, close, pickDirectory }) {
      const translate = typeof t === 'function' ? t : key => key;
      return h('div', null, h(SettingsForm, {
        t: translate, variant: 'section', onClose: close,
        pickDirectory: typeof pickDirectory === 'function' ? pickDirectory : directoryPicker,
      }));
    }

    function apply(ctx) {
      const t = ctx.locale.bind(NS);
      // `uiWorkspace` is declared in the plugin's inject list, so the fiber only
      // activates once that service exists and `ctx.uiWorkspace` is readable.
      const pickFolder = () => {
        try {
          const service = ctx.uiWorkspace;
          if (service && typeof service.pickDirectory === 'function') return service.pickDirectory();
        } catch { /* Defensive: keep the manual-path fallback usable. */ }
        return Promise.reject(new Error(t('noPicker')));
      };
      directoryPicker = pickFolder;
      ctx.effect(() => ctx.locale.register(NS, 'zh', copy.zh), 'voice-input: zh');
      ctx.effect(() => ctx.locale.register(NS, 'en', copy.en), 'voice-input: en');
      // The command lives in the shell catalog, so the composer tooltip, the global
      // shortcut reference, and this form's editor can never disagree. Linux web
      // rejects almost every combination, so it gets the one free Mod+Shift+Comma.
      shortcutsService = ctx.shortcuts;
      ctx.effect(() => ctx.shortcuts.register({
        id: SHORTCUT_ID,
        label: () => t('dictation'),
        aliases: ['听写', '语音输入', 'dictation', 'voice input', 'speech'],
        defaults: {
          'desktop:macos': { code: 'KeyD', modifiers: ['primary', 'shift'] },
          'desktop:windows': { code: 'KeyD', modifiers: ['primary', 'shift'] },
          'desktop:linux': { code: 'KeyD', modifiers: ['primary', 'shift'] },
          'web:macos': { code: 'KeyD', modifiers: ['primary', 'shift'] },
          'web:windows': { code: 'KeyD', modifiers: ['primary', 'shift'] },
          'web:linux': { code: 'Comma', modifiers: ['primary', 'shift'] },
        },
        regions: ['page', 'editable'],
        modals: [],
        resolve: () => (dictateRunner
          ? { status: 'handled', run: dictateRunner }
          : { status: 'blocked', reason: t('shortcutUnavailable') }),
      }), 'voice-input: dictate shortcut');
      ctx.slots.inject('conversation.input.activity', () => ctx.slots.register({
        name: 'conversation.input.activity', id: 'voice-input', locale: NS,
      }, VoiceInput));
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: 'voice-input', order: 55, locale: NS,
        label: () => t('settings'), inject: () => ({ t, pickDirectory: pickFolder }),
      }, VoiceSettingsSection));
    }
    module.exports = { apply, inject: ['slots', 'locale', 'uiWorkspace', 'shortcuts'], VoiceInput, VoiceSettingsSection, SettingsForm };
    return module.exports;
  },
});
