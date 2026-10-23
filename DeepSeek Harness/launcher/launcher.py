#!/usr/bin/env python3
"""Start a local DSH web session in a dedicated Chromium application window."""

import argparse
import fcntl
import json
import os
import queue
import re
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlsplit


APP_ID = "deepseek-harness-launcher"
BROWSERS = ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "brave-browser", "microsoft-edge", "vivaldi")
TOKEN_URL = re.compile(r"https?://[^\s]+")


def xdg_path(variable, default):
    value = os.environ.get(variable)
    return Path(value).expanduser() if value and Path(value).is_absolute() else Path.home() / default


CONFIG = xdg_path("XDG_CONFIG_HOME", ".config") / APP_ID / "config.json"
STATE = xdg_path("XDG_STATE_HOME", ".local/state") / APP_ID
DATA = xdg_path("XDG_DATA_HOME", ".local/share") / APP_ID


def find_browser():
    return next((shutil.which(name) for name in BROWSERS if shutil.which(name)), "")


def node_version(path):
    try:
        result = subprocess.run([path, "--version"], cwd=Path.home(), capture_output=True, text=True, timeout=5, check=False)
        parts = result.stdout.strip().lstrip("v").split(".")
        return (int(parts[0]), int(parts[1])) if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired, ValueError, IndexError):
        return None


def supported_node(version):
    return version is not None and (version[0] == 22 and version[1] >= 19 or version[0] >= 24)


def env_path(name, default):
    value = os.environ.get(name)
    return Path(value).expanduser() if value and Path(value).expanduser().is_absolute() else default


def find_node():
    home = Path.home()
    candidates = [shutil.which("node")]
    data = xdg_path("XDG_DATA_HOME", ".local/share")
    installs = (
        env_path("NVM_DIR", home / ".nvm") / "versions/node",
        env_path("FNM_DIR", data / "fnm") / "node-versions",
        env_path("MISE_INSTALLS_DIR", env_path("MISE_DATA_DIR", data / "mise") / "installs") / "node",
        env_path("ASDF_DATA_DIR", home / ".asdf") / "installs/nodejs",
    )
    candidates.extend(installs[0].glob("*/bin/node"))
    candidates.extend(installs[1].glob("*/installation/bin/node"))
    candidates.extend(installs[2].glob("*/bin/node"))
    candidates.extend(installs[3].glob("*/bin/node"))
    candidates.extend((env_path("VOLTA_HOME", home / ".volta") / "bin/node",
                       env_path("ASDF_DATA_DIR", home / ".asdf") / "shims/node"))
    versions = [(version, str(path)) for path in candidates if path and (version := node_version(path)) and supported_node(version)]
    return max(versions)[1] if versions else (shutil.which("node") or "")


def dsh_command(node, path):
    return [node, str(path)] if Path(path).suffix in (".js", ".mjs", ".cjs") else [str(path)]


def dsh_works(node, path):
    if not node or not path or not Path(path).is_file():
        return False
    env = os.environ.copy()
    env["PATH"] = str(Path(node).parent) + os.pathsep + env.get("PATH", "")
    try:
        result = subprocess.run(dsh_command(node, path) + ["--version"], cwd=Path.home(), env=env,
                                capture_output=True, text=True, timeout=8, check=False)
        return result.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def find_dsh(node):
    home = Path.home()
    data = xdg_path("XDG_DATA_HOME", ".local/share")
    candidates = [shutil.which("dsh"),
                  data / "deepseek-harness/node_modules/@deepseek-ai/dsh/lib/bin.js",
                  home / ".local/share/deepseek-harness/node_modules/@deepseek-ai/dsh/lib/bin.js",
                  env_path("PNPM_HOME", data / "pnpm") / "dsh"]
    # npm links global binaries into the chosen Node installation's bin folder.
    if node:
        prefix = Path(node).resolve().parent.parent
        candidates.extend((prefix / "bin/dsh", prefix / "lib/node_modules/@deepseek-ai/dsh/lib/bin.js"))
        npm = Path(node).parent / "npm"
        if npm.is_file():
            try:
                env = os.environ.copy()
                env["PATH"] = str(Path(node).parent) + os.pathsep + env.get("PATH", "")
                result = subprocess.run([str(npm), "prefix", "-g"], cwd=home, env=env,
                                        capture_output=True, text=True, timeout=5, check=False)
                if result.returncode == 0 and Path(result.stdout.strip()).is_absolute():
                    prefix = Path(result.stdout.strip())
                    candidates.extend((prefix / "bin/dsh", prefix / "lib/node_modules/@deepseek-ai/dsh/lib/bin.js"))
            except (OSError, subprocess.TimeoutExpired):
                pass
    npm_cache = env_path("NPM_CONFIG_CACHE", home / ".npm")
    candidates.extend(npm_cache.glob("_npx/*/node_modules/@deepseek-ai/dsh/lib/bin.js"))
    for candidate in candidates:
        if candidate and dsh_works(node, candidate):
            return str(candidate)
    return ""


def discover_config():
    node = find_node()
    return {"node": node, "dsh": find_dsh(node), "browser": find_browser()}


def read_saved_config():
    try:
        data = json.loads(CONFIG.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or not all(isinstance(data.get(key), str) and data.get(key) for key in ("node", "dsh", "browser")):
            return None
        return {key: data[key] for key in ("node", "dsh", "browser")}
    except (OSError, ValueError, TypeError):
        return None


def executable(value):
    if not value:
        return None
    candidate = shutil.which(value) if os.sep not in value else value
    if not candidate:
        return None
    path = Path(candidate).expanduser()
    return str(path.resolve()) if path.is_file() and os.access(path, os.X_OK) else None


def check_config(config):
    """Return resolved paths and actionable problems, without launching DSH."""
    found = {}
    problems = []
    node = executable(config.get("node", ""))
    if not node:
        problems.append("Node.js executable not found. Select the node executable.")
    else:
        version = node_version(node)
        if version is None:
            problems.append("Node.js version could not be checked.")
        elif not supported_node(version):
            problems.append("DeepSeek Harness requires Node.js 22.19+ or 24+.")
        else:
            found["node"] = node

    dsh_value = config.get("dsh", "")
    dsh = executable(dsh_value)
    if not dsh and dsh_value.endswith((".js", ".mjs", ".cjs")):
        candidate = Path(dsh_value).expanduser()
        if candidate.is_file():
            dsh = str(candidate.resolve())
    if not dsh:
        problems.append("DSH CLI not found. Select the dsh executable or its bin.js file.")
    else:
        if dsh_works(node, dsh):
            found["dsh"] = dsh
        else:
            problems.append("DSH CLI could not run. Check its path and installation.")

    browser = executable(config.get("browser", ""))
    if not browser:
        problems.append("Chromium-based browser not found. Select its executable.")
    else:
        found["browser"] = browser
    return found, problems


def save_config(config):
    CONFIG.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    temporary = CONFIG.with_suffix(".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump(config, stream, indent=2)
        stream.write("\n")
    os.replace(temporary, CONFIG)


def startup_config(saved):
    """Use valid saved settings silently; recover moved dependencies when possible."""
    if saved is None:
        discovered = discover_config()
        resolved, problems = check_config(discovered)
        return discovered, resolved, problems, True
    resolved, problems = check_config(saved)
    if not problems:
        return saved, resolved, problems, False
    discovered = discover_config()
    merged = {key: saved[key] if key in resolved else discovered[key] for key in saved}
    resolved, problems = check_config(merged)
    return merged, resolved, problems, bool(problems)


def safe_message(message):
    return TOKEN_URL.sub("[URL hidden]", message.strip())[:500]


def bootstrap_error(message):
    print(message, file=sys.stderr)
    if shutil.which("zenity"):
        subprocess.run(["zenity", "--error", "--title=DeepSeek Harness Launcher", f"--text={message}"], check=False)
    elif shutil.which("kdialog"):
        subprocess.run(["kdialog", "--error", message], check=False)


def startup_url(line):
    prefix = "dsh web: "
    if not line.startswith(prefix):
        return None
    candidate = line[len(prefix):].strip()
    parsed = urlsplit(candidate)
    if parsed.scheme != "http" or parsed.hostname != "127.0.0.1" or not parsed.port or parsed.username or parsed.password:
        raise ValueError("DSH returned an unexpected startup URL")
    return candidate


def terminate_group(process):
    if not process:
        return
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        try:
            os.killpg(process.pid, 0)
        except ProcessLookupError:
            break
        time.sleep(.05)
    else:
        # The parent may have exited while its children remained in the group.
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    try:
        process.wait(timeout=1)
    except subprocess.TimeoutExpired:
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="print dependency diagnostics without opening a window")
    parser.add_argument("--configure", action="store_true", help="show the dependency setup window")
    args = parser.parse_args()
    saved = read_saved_config()
    if args.check:
        _, resolved, problems, _ = startup_config(saved)
        print(json.dumps({"resolved": resolved, "problems": problems}, indent=2))
        return 0 if not problems else 1

    STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    lock = open(STATE / "launcher.lock", "a+")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return 0

    config, initial_resolved, initial_problems, needs_setup = startup_config(saved)
    if saved is not None and not needs_setup and config != saved:
        save_config(config)
    needs_setup = needs_setup or args.configure

    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox, ttk
    except ImportError:
        bootstrap_error("Python tkinter is required for the setup window (install your distribution's python3-tk package).")
        return 1

    try:
        root = tk.Tk()
    except tk.TclError as error:
        bootstrap_error(f"Graphical session unavailable: {error}")
        return 1
    root.withdraw()
    root.title("DeepSeek Harness Launcher")
    root.geometry("630x340")
    root.resizable(True, False)
    frame = ttk.Frame(root, padding=18)
    frame.pack(fill="both", expand=True)
    ttk.Label(frame, text="DeepSeek Harness", font=("sans", 16, "bold")).grid(row=0, column=0, columnspan=3, sticky="w", pady=(0, 10))
    ttk.Label(frame, text="Select local dependencies. Paths are saved only for this user.").grid(row=1, column=0, columnspan=3, sticky="w", pady=(0, 10))
    values = {key: tk.StringVar(value=config.get(key, "")) for key in ("node", "dsh", "browser")}
    labels = {"node": "Node.js", "dsh": "DSH CLI", "browser": "Chromium browser"}
    for row, key in enumerate(values, start=2):
        ttk.Label(frame, text=labels[key]).grid(row=row, column=0, sticky="w", pady=5)
        ttk.Entry(frame, textvariable=values[key]).grid(row=row, column=1, sticky="ew", padx=8, pady=5)
        ttk.Button(frame, text="Browse…", command=lambda k=key: values[k].set(filedialog.askopenfilename(title=f"Select {labels[k]}") or values[k].get())).grid(row=row, column=2)
    frame.columnconfigure(1, weight=1)
    status = tk.StringVar()
    ttk.Label(frame, textvariable=status, wraplength=580, foreground="#9b3026").grid(row=5, column=0, columnspan=3, sticky="w", pady=(10, 4))
    events = queue.Queue()
    server = None
    browser = None
    closing = False
    deadline = None
    ready = False
    last_error = ""
    close_reason = ""
    resolved_browser = ""
    profile = DATA / "browser-profile"

    def current():
        return {key: value.get().strip() for key, value in values.items()}

    def validate():
        resolved, problems = check_config(current())
        status.set("; ".join(problems) if problems else "Ready to launch.")
        return resolved, problems

    def stop(reason):
        nonlocal closing, close_reason
        if closing:
            return
        closing = True
        close_reason = reason
        status.set(reason)
        # Waiting for process shutdown must not freeze the Tk event loop.
        def finish():
            terminate_group(browser)
            terminate_group(server)
            events.put(("closed", ""))
        threading.Thread(target=finish, daemon=True).start()

    def consume(stream, kind):
        for line in iter(stream.readline, ""):
            events.put((kind, line.rstrip("\r\n")))
        stream.close()

    def launch(resolved):
        nonlocal server, deadline, ready, last_error, resolved_browser
        resolved_browser = resolved["browser"]
        profile.mkdir(mode=0o700, parents=True, exist_ok=True)
        STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
        env = os.environ.copy()
        env["PATH"] = str(Path(resolved["node"]).parent) + os.pathsep + env.get("PATH", "")
        dsh = resolved["dsh"]
        command = dsh_command(resolved["node"], dsh)
        command += ["web", "--no-open", "--host", "127.0.0.1", "--port", "0"]
        try:
            server = subprocess.Popen(command, cwd=Path.home(), env=env, stdin=subprocess.DEVNULL,
                                      stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1,
                                      start_new_session=True)
        except OSError as error:
            messagebox.showerror("Launch failed", str(error))
            root.deiconify()
            start_button.state(["!disabled"])
            return
        for kind, stream in (("stdout", server.stdout), ("stderr", server.stderr)):
            threading.Thread(target=consume, args=(stream, kind), daemon=True).start()
        ready = False
        last_error = ""
        deadline = time.monotonic() + 60
        start_button.state(["disabled"])
        status.set("Starting DeepSeek Harness…")

    def poll():
        nonlocal browser, server, ready, last_error, closing, deadline
        while True:
            try:
                kind, value = events.get_nowait()
            except queue.Empty:
                break
            if kind == "closed":
                failed = (not ready or close_reason.startswith(("Browser failed:", "Browser exited", "DeepSeek Harness exited"))) and close_reason not in ("Launcher closed.", "Launcher terminated.")
                if failed:
                    messagebox.showerror("Launch failed", close_reason)
                    while not events.empty():
                        events.get_nowait()
                    server = browser = None
                    ready = closing = False
                    deadline = None
                    start_button.state(["!disabled"])
                    root.deiconify()
                    validate()
                    break
                root.destroy()
                return
            if kind == "stdout" and not closing:
                try:
                    url = startup_url(value)
                except ValueError as error:
                    stop(str(error))
                    continue
                if url and not ready:
                    ready = True
                    try:
                        browser = subprocess.Popen([resolved_browser, f"--user-data-dir={profile}",
                                                    "--no-first-run", "--disable-background-mode",
                                                    "--class=deepseek-harness", f"--app={url}"],
                                                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                                   stderr=subprocess.DEVNULL, start_new_session=True)
                        root.withdraw()
                    except OSError as error:
                        stop(f"Browser failed: {error}")
            elif kind == "stderr" and not closing and value:
                last_error = safe_message(value)
        if server and not closing:
            if server.poll() is not None:
                stop(f"DeepSeek Harness exited: {last_error or 'see installation and configuration.'}")
            elif deadline and not ready and time.monotonic() > deadline:
                stop(f"DeepSeek Harness startup timed out. {last_error}")
        if browser and not closing and browser.poll() is not None:
            stop("DeepSeek window closed." if browser.returncode == 0 else f"Browser exited with status {browser.returncode}.")
        root.after(100, poll)

    def start():
        resolved, problems = validate()
        if problems:
            return
        save_config(current())
        launch(resolved)

    buttons = ttk.Frame(frame)
    buttons.grid(row=6, column=0, columnspan=3, sticky="e", pady=12)
    ttk.Button(buttons, text="Check dependencies", command=validate).pack(side="left", padx=5)
    start_button = ttk.Button(buttons, text="Launch DeepSeek", command=start)
    start_button.pack(side="left")
    root.protocol("WM_DELETE_WINDOW", lambda: stop("Launcher closed.") if server else root.destroy())
    for signum in (signal.SIGINT, signal.SIGTERM):
        signal.signal(signum, lambda _signum, _frame: stop("Launcher terminated."))
    if needs_setup:
        status.set("; ".join(initial_problems) if initial_problems else "Ready to launch.")
        root.deiconify()
    else:
        root.after(0, lambda: launch(initial_resolved))
    root.after(100, poll)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
