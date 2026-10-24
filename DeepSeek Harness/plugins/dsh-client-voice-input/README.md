[中文](./README.zh-CN.md)

# Offline voice input for DeepSeek Harness

[Detailed design](./docs/design.md)

This plugin adds a microphone between the model selector and Send in the Harness composer. Click to record, click again to stop, and the plugin transcribes locally into the current draft. **It never sends the draft automatically.** This first release transcribes after recording; it does not show live partial text.

## Architecture and user flow

1. **Load:** Harness loads the browser half through `dsh.client`. The host half registers authenticated `/api/voice.*` routes on Harness Connection. No separate persistent server or fixed port is needed.
2. **First use:** The microphone is a single toolbar control. Clicking it while offline recognition is not ready opens the settings card instead of recording. The microphone carries a status light — green when offline speech is ready, red while it still needs setup, pulsing amber while a check runs — and hovering it opens a dark card with the label “Dictation”, the same status light plus a word, and the current shortcut as text (for example `Ctrl+Shift+D`). Once the model and runtime check out, the same click records.
3. **Reopening settings:** Right-click (or long-press) the microphone for the quick menu, or open Settings → Voice settings, which renders the exact same form. The status row pairs the same light with a one-line explanation and an explicit re-check button (the quick menu offers the same action); re-checking updates the light instead of printing a message. No second gear icon is added to the composer, and the toolbar only expands while recording or transcribing — feedback never pushes the model selector or Send around.
4. **Managed setup:** Creates a private Python virtual environment and downloads the SenseVoiceSmall INT8 model from the official sherpa-onnx release. These live in the user's XDG data directory, outside the repository.
5. **Manual configuration:** The settings card always lists the effective configuration — the real model directory and Python executable, including the managed defaults, with each row tagged “ready” or “missing”. Each path carries two icons — copy and choose folder — and the path field itself is editable. Picks apply immediately, typed paths apply through the footer “Save” button, and an empty field shows the managed default path beneath it. A chosen virtual-environment folder is resolved by the host into the interpreter it contains. Paths are saved only in the user's configuration file. Chinese, automatic, English, Cantonese, Japanese, and Korean recognition modes are available. The status line, model directory, and Python path each carry the same “!” hint that appears on hover or keyboard focus.
6. **Record:** The browser asks for microphone permission. Recording is limited to 80 seconds and converted in the browser to 16 kHz mono PCM WAV. Audio is never sent to an Internet endpoint. While recording, the composer expands into a horizontal strip: “×” on the left discards the take without transcribing, the waveform and timer run through the middle, and “■” on the right finishes and transcribes. Press **Esc** to discard the take immediately, or **Enter** to finish the take and drop the transcript into the draft; neither shortcut ever sends, so the text stays editable. “■” does the same as Enter.
7. **Transcribe:** The WAV reaches the current Harness host through its authenticated local API. A Python worker is started for this request only, runs offline recognition, then exits. Active workers are terminated on plugin disposal, Harness exit, or request cancellation.
8. **Insert:** Harness `InputActions.captureInsertion()` and `insertText()` add one undoable draft edit. If the draft changed while recognition ran, the toast offers the result for copying instead of overwriting the new draft.

## Keyboard shortcut

The plugin registers one shell command, “Dictation” (`voice-input.dictate`), so the shortcut is not plugin-private: it lives in Harness's shortcut catalog with the same conflict detection, keycap presentation, and saved preferences as every other command.

- Default: `Ctrl/Cmd+Shift+D` on desktop (including Linux desktop) and on Windows/macOS web; Linux web is limited by Harness policy to `Ctrl+Shift+,`.
- Edit it by clicking the shortcut in the “Input” card of Voice settings, then pressing the new combination (Esc or a click elsewhere cancels; a “Restore default” button appears once the binding is modified). Settings → General → Shortcuts edits the same preference.
- While recording, the same combination stops and transcribes; when offline speech is not set up yet, it opens the settings card.
- Linux web accepts only `Ctrl+/`, `Ctrl+Shift+,`, and `Ctrl+Shift+.` — a Harness restriction for browser shortcuts, not a plugin choice. The desktop app has no such limit.

See the [Harness composer API](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md), [sherpa-onnx SenseVoice API](https://k2-fsa.github.io/sherpa/onnx/sense-voice/python-api.html), and [official INT8 model](https://github.com/k2-fsa/sherpa-onnx/blob/master/docs/source/onnx/sense-voice/pretrained.rst).

## Install

Requires the DeepSeek Harness Web client (implemented against the `0.2.1-rc.2` plugin API), a browser with microphone access, Python 3, and `venv`. Managed setup needs Internet access once; recording and transcription work offline afterward. A GPU is not required. The Linux desktop launcher is optional.

From the repository root:

```sh
dsh plugin --profile web add "./DeepSeek Harness/plugins/dsh-client-voice-input"
dsh web
```

Open a session and click the microphone, then “Download and set up offline model.” The first setup can take several minutes and a few hundred MB of disk space. Click the microphone again to record. To use an existing runtime, use the two icons on each row: the folder icon picks a directory and the copy icon copies the path. The path field itself is editable; press “Save settings” after typing. Changing the language or manual paths does not redownload an existing model.

Uninstall the plugin:

```sh
dsh plugin --profile web remove dsh-client-voice-input
```

To remove its data as well, exit Harness and delete `$XDG_DATA_HOME/dsh-client-voice-input` (default `$HOME/.local/share/dsh-client-voice-input`) and `$XDG_CONFIG_HOME/dsh-client-voice-input` (default `$HOME/.config/dsh-client-voice-input`). The plugin removal command keeps user data for reinstalls.

## Privacy and extension points

At runtime, audio only traverses the browser, the current Harness process, and a short-lived local recognition worker. Model and Python package downloads are the only network operations, during first setup. Harness authenticates API routes; the host limits WAV format and size. The plugin does not call OS speech services or send recognized text automatically.

Responsibilities are layered: `lib/core.js` is the engine registry (directory, archive, source, file list, languages) plus validation; `lib/store.js` reads and atomically writes configuration; `lib/runner.js` owns child processes and bounded reads; `lib/index.js` is only routing and setup orchestration; `lib/client.js` is only recording and UI; the two `runtime/` scripts are the engine adapter. Adding a recognizer means one `ENGINES` descriptor plus its two scripts — routes, settings, and draft insertion stay untouched. The INT8 model is roughly 228–229 MB; performance depends on the computer.

### Portability

Source contains no machine-specific path. Models, virtual environments, and configuration derive from XDG conventions; `DSH_VOICE_HOME` collapses them into one directory (used by tests and portable installs). Manual entries accept a leading `~/` and are expanded before saving; other relative paths are rejected. Logs, audio, and transcripts are never written to disk.

| Variable | Purpose |
| --- | --- |
| `DSH_VOICE_HOME` | Keep data and configuration under one directory (`data/`, `config.json`). |
| `DSH_VOICE_PYTHON` | System interpreter for managed setup; defaults to `python3`. |

## Checks

```sh
cd "DeepSeek Harness/plugins/dsh-client-voice-input"
npm test
node --check lib/index.js
node --check lib/client.js
python3 -m py_compile runtime/setup.py runtime/transcribe.py
```
