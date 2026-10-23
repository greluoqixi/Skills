[中文](./README.zh-CN.md)

# DeepSeek Harness Launcher for Linux

Open the **DeepSeek Harness Web UI** in its own Chromium window from the Linux application menu. Closing that window stops the DSH server started by the launcher. This is a separate, user-level application; it does not bundle or install DSH, Node.js, a browser, or API credentials.

## Requirements

- Linux graphical session, Python 3, and Tkinter (`python3-tk` on many distributions).
- [Node.js 22.19+ or 24+](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md) and an installed [`@deepseek-ai/dsh` CLI](https://github.com/deepseek-ai/deepseek-harness/tree/master/apps/cli).
- A Chromium-based browser supporting `--app` and `--user-data-dir`.

Install DSH separately using the [official instructions](https://www.deepseek.com/harness/en/). Model and API key settings remain in DSH.

## Application workflow

1. **Install:** From this directory, run `python3 install.py`. No `sudo` is needed. The installer prints the installed command path and creates a **DeepSeek Harness** application-menu entry.
2. **First launch:** Open the application-menu entry. Review the detected Node, DSH, and browser paths. Use **Browse** for anything missed, then select **Launch DeepSeek**. The choices are saved for this user.
3. **Later launches:** Click the same icon to open DeepSeek directly. Saved paths are checked without showing setup. If a path moves, the launcher tries discovery again and opens setup only if it cannot recover.
4. **Change settings:** Close the DeepSeek window, then use the icon's **Configure DeepSeek Harness** desktop action or run `deepseek-harness-launcher --configure`.
5. **Diagnose:** Run `deepseek-harness-launcher --check` to print detected paths and missing dependencies without opening a window.

If the installed command is not on `PATH`, use the path printed by the installer in steps 4–5.

Discovery checks `PATH`, common nvm/fnm/mise/asdf/Volta Node locations, global npm and pnpm CLI locations, a per-user DSH installation, and an existing npx cache. It only inspects local files and may run `--version` or `npm prefix -g`; it never downloads packages. For a source checkout or an unusual layout, select the Node executable, DSH executable or `bin.js`, and browser manually.

## Uninstall

Close the DeepSeek window first, then run one of these commands:

```sh
deepseek-harness-launcher --uninstall
deepseek-harness-launcher --uninstall --keep-data
```

The first command removes the desktop entry, installed launcher, its saved settings, dedicated Chromium profile, and launcher state. The second removes the application while retaining settings, the browser profile, and launcher state for a later reinstall. If the installed command is not on `PATH`, use the path printed during installation. You can also run `python3 install.py --uninstall` (with optional `--keep-data`) from this source directory. Uninstall refuses to run while the launcher is active. It does not remove DSH, Node.js, the browser, DSH sessions, or DSH credentials.

## Files and operation

The installer uses the current user's XDG directories. It places the desktop entry under `XDG_DATA_HOME/applications`, the command under `XDG_BIN_HOME`, installed code and the dedicated browser profile under `XDG_DATA_HOME/deepseek-harness-launcher`, settings under `XDG_CONFIG_HOME/deepseek-harness-launcher`, and the single-instance lock under `XDG_STATE_HOME/deepseek-harness-launcher`. Standard per-user defaults apply when these variables are unset. No personal installation path is embedded in the source.

The launcher runs `dsh web --no-open --host 127.0.0.1 --port 0`, reads DSH's startup URL, and passes it only to the browser process. That URL contains a session token and is not logged. DSH and the browser run in process groups owned by this launch; closing the browser window terminates them. Startup failures return to setup with a diagnostic.

## License

MIT; see [LICENSE](./LICENSE).
