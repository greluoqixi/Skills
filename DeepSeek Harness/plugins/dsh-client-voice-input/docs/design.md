[中文](./design.zh-CN.md)

# Offline voice input design

## Scope

Speech creates a draft for the user to review and send. This release records up to 80 seconds and transcribes after recording stops. It requires no desktop launcher, fixed port, GPU, cloud speech API, or developer-specific path. Initial package and model setup needs a network connection; subsequent transcription does not.

## Components

| Component | Responsibility |
| --- | --- |
| `lib/client.js` | Composer activity slot plus Settings-center section, bilingual UI, browser recording, 16 kHz PCM conversion, draft insertion. |
| `lib/index.js` | Authenticated host API, status cache, setup orchestration, worker lifecycle. |
| `lib/core.js` | Engine registry, XDG/`DSH_VOICE_HOME` paths, `~` expansion, configuration and WAV validation. |
| `lib/store.js` | Configuration reads and atomic writes, falling back to defaults on a corrupt file. |
| `lib/runner.js` | Worker execution (timeout, cancellation, process group) and bounded body reads. |
| `runtime/setup.py` | Private virtual environment, dependency check, model download and constrained extraction. |
| `runtime/transcribe.py` | One WAV in, one JSON text result out, then exit. |

## Flow

`Unconfigured → Setting up → Ready → Recording → Transcribing → Idle`. A successful run writes the text into the draft and returns to idle without a status message. Errors return to a usable settings or idle state.

The composer exposes exactly one control: a microphone in `conversation.input.activity`. The slot expands only while recording or transcribing, so the model selector, Send, and the toolbar geometry stay put during setup and error reporting. Clicking the microphone when offline recognition is not ready opens the settings card; once the model and runtime are ready the same click records. Readiness is a status light on the microphone itself — green when usable, red when it still needs setup, amber and pulsing while a probe is in flight — so status never costs composer width and never appears as text near the icon. Toasts are reserved for things that need reading: permission failures, unrecognized speech, and a draft that changed during recognition. The status row in the settings card pairs the same light with a one-line explanation and an explicit re-check button that spins while it works, and its “!” hint is rebuilt from the live probe — checking, unknown, ready, or the exact missing parts — while each path row carries a ready/missing tag that follows every check.

Hover or keyboard focus opens a small dark card above the microphone: “Dictation”, the same status light with its word, and the accepted shortcut as one line of text (`Ctrl+Shift+D`). It replaces the native `title` tooltip so status and shortcut are readable in one glance and follow the page theme instead of the operating system.

Recording is reachable from the keyboard as well. The client registers `voice-input.dictate` with the shell's shortcut service, which owns conflict detection, keycap presentation, and persisted overrides; the registration is disposed with the plugin. Defaults cover all six runtime/platform profiles — `Mod+Shift+D`, except Linux web, where the shell permits only `Mod+Slash`, `Mod+Shift+Comma`, and `Mod+Shift+Period`, so the default there is `Mod+Shift+Comma`. The “Input” card turns the shortcut into one clickable control: a single frame holding the key names joined with plus signs, and clicking it starts recording (Esc or a click elsewhere cancels) through the same service (`describeBinding`, then `edit` with the reviewed revision), so an edit made there and an edit made in Settings → General → Shortcuts can never disagree. A rejected combination explains the reason and stays open for another attempt.

Settings remain reachable in two places: the microphone context menu (`onContextMenu`, which also covers touch long-press) and the Settings-center `settings.section` page. Both render the same `SettingsForm`, so configuration semantics cannot drift between them.

The card is written for a first-time user. The card is sectioned as status → primary action → effective paths → language → advanced → actions, and every explanation (overview, model directory, Python path) uses the same “!” hover/focus hint instead of stacked paragraphs, and “Effective configuration” always lists the absolute model directory and Python executable — including the managed defaults, tagged “missing” until installed — so nobody has to guess which directory is in play. There is a single interaction: the path field is editable and two icons act on it — copy and choose (`ctx.uiWorkspace.pickDirectory()`). Picks apply immediately; typed paths apply on “Save settings”. After a virtual-environment folder is chosen the host resolves its interpreter and keeps the folder in the field when resolution fails.

1. The client requests `GET /api/voice.status`. The host checks both model files and imports `sherpa_onnx` plus `numpy` with the selected Python executable.
2. Managed setup clears manual paths and calls `POST /api/voice.setup`. The host installs a private runtime and downloads the official INT8 archive into XDG user data. Incomplete setup can be retried.
3. Recording uses browser `getUserMedia`. It captures the draft selection and revision before recording. During recording the composer expands into a full-width strip laid out left to right: a Cancel circle that discards the take without transcribing, an animated waveform with the elapsed timer in the middle, and a solid Finish circle that stops and transcribes. Esc cancels immediately, and Enter does exactly what Finish does: stop, transcribe, and insert into the draft. Neither path submits on its own, so the transcript stays editable and the user decides when to send. After stop, the browser converts audio to 16 kHz mono 16-bit WAV.
4. `POST /api/voice.transcribe` validates the WAV and its 3 MB limit, starts one Python worker, and returns `{ "text": "..." }`. No recognition process remains after the request.
5. `InputActions.insertText(text, span)` adds one undoable edit. If the draft revision changed, the toast offers the result for copying instead of replacing newer text.

## API and storage

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/voice.status` | GET | Configuration, effective paths (`modelDir`, `python`), managed defaults, model, and runtime readiness. |
| `/api/voice.config` | POST JSON | Save `modelDir`, `python`, and `language`; empty paths use managed resources. |
| `/api/voice.setup` | POST | Install the managed runtime and model on demand. |
| `/api/voice.transcribe` | POST WAV | Return recognized text without storing audio. |

Harness Connection authenticates these routes for the owner. User configuration is under `$XDG_CONFIG_HOME/dsh-client-voice-input`; managed data is under `$XDG_DATA_HOME/dsh-client-voice-input`, with standard home-directory fallbacks. No machine-specific absolute path is embedded in source code. Manually chosen absolute paths exist only in the user's configuration file.

## Recovery and lifecycle

Microphone denial reports a permission error without starting inference. Missing model or runtime opens settings. Network interruption leaves existing model files intact and setup can be retried. A changed draft cannot be overwritten by a late transcript. Disposing the plugin, exiting Harness, or cancelling a transcription stops its worker; closing the Linux launcher window exits Harness.

## Portability

No machine-specific path appears in source. Models, virtual environments, and configuration derive from XDG conventions, or collapse into one directory through `DSH_VOICE_HOME` (used by tests and portable installs). Manual entries accept a leading `~/` and expand to an absolute path before saving; other relative paths are rejected so the host never guesses a working directory. The install location (`link:` in a profile) belongs to the user's environment and never enters the repository.

| Variable | Purpose |
| --- | --- |
| `DSH_VOICE_HOME` | Keep data and configuration under one directory (`data/` and `config.json`). |
| `DSH_VOICE_PYTHON` | System interpreter used for managed setup (defaults to `python3`). |

## Extension seams

The engine layer is data-driven: `ENGINES` in `lib/core.js` describes each recognizer's directory, archive, source, file list, languages, and two runtime scripts (setup and transcription). Adding a recognizer means one descriptor plus its Python scripts — host routes, the settings surface, and draft insertion stay untouched. Keep the `{text}` result and draft insertion contract stable while adding VAD, device selection, vocabulary correction, or download progress. Live partial transcription is a separate later feature.

## Validation

Verified against DSH `0.2.1-rc.2`: plugin loading, composer control, first-run settings, managed environment/model setup, and a full authenticated API transcription using sherpa-onnx's official Chinese sample. Tests cover configuration, WAV limits, model-file detection, and host routes. Package inspection confirms model files and Python caches are excluded.
