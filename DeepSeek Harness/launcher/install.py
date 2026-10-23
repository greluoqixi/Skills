#!/usr/bin/env python3
"""Install or remove a per-user Linux desktop entry for the DSH launcher."""

import argparse
import fcntl
import os
import shlex
import shutil
import stat
import subprocess
from pathlib import Path


APP_ID = "deepseek-harness-launcher"
SOURCE = Path(__file__).resolve().parent


def xdg_path(variable, default):
    value = os.environ.get(variable)
    return Path(value).expanduser() if value and Path(value).is_absolute() else Path.home() / default


def desktop_quote(path):
    return '"' + str(path).replace("\\", "\\\\").replace('"', '\\"').replace("$", "\\$").replace("`", "\\`") + '"'


def refresh_desktop_database(applications):
    command = shutil.which("update-desktop-database")
    if command:
        subprocess.run([command, str(applications)], stdout=subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL, check=False)


def copy_if_needed(source, destination):
    if source.resolve() != destination.resolve():
        shutil.copy2(source, destination)


def remove_owned_path(path):
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--uninstall", action="store_true", help="remove the launcher and its user data")
    parser.add_argument("--keep-data", action="store_true", help="with --uninstall, retain settings and browser profile")
    args = parser.parse_args()
    if args.keep_data and not args.uninstall:
        parser.error("--keep-data requires --uninstall")
    data_home = xdg_path("XDG_DATA_HOME", ".local/share")
    bin_home = xdg_path("XDG_BIN_HOME", ".local/bin")
    config_home = xdg_path("XDG_CONFIG_HOME", ".config")
    state_home = xdg_path("XDG_STATE_HOME", ".local/state")
    app_dir = data_home / APP_ID
    entry = data_home / "applications" / f"{APP_ID}.desktop"
    wrapper = bin_home / APP_ID
    if args.uninstall:
        state_dir = state_home / APP_ID
        state_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        with (state_dir / "launcher.lock").open("a+") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                parser.exit(1, "Close DeepSeek Harness before uninstalling the launcher.\n")
            entry.unlink(missing_ok=True)
            wrapper.unlink(missing_ok=True)
            if args.keep_data:
                for name in ("launcher.py", "install.py", "icon.svg"):
                    (app_dir / name).unlink(missing_ok=True)
                remove_owned_path(app_dir / "__pycache__")
            else:
                remove_owned_path(app_dir)
                remove_owned_path(config_home / APP_ID)
        if not args.keep_data:
            remove_owned_path(state_dir)
        refresh_desktop_database(entry.parent)
        print("Launcher removed. User data retained." if args.keep_data else "Launcher and its user data removed.")
        return
    app_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    bin_home.mkdir(mode=0o755, parents=True, exist_ok=True)
    entry.parent.mkdir(mode=0o755, parents=True, exist_ok=True)
    for name in ("launcher.py", "install.py", "icon.svg"):
        copy_if_needed(SOURCE / name, app_dir / name)
    launcher = shlex.quote(str(app_dir / "launcher.py"))
    uninstaller = shlex.quote(str(app_dir / "install.py"))
    wrapper.write_text("#!/bin/sh\n"
                       'if [ "${1-}" = "--uninstall" ]; then\n'
                       "  shift\n  exec python3 " + uninstaller + ' --uninstall "$@"\n'
                       "fi\nexec python3 " + launcher + ' "$@"\n', encoding="utf-8")
    wrapper.chmod(wrapper.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    entry.write_text("[Desktop Entry]\nType=Application\nName=DeepSeek Harness\n"
                     "Comment=Open DeepSeek Harness in a dedicated window\n"
                     f"Exec={desktop_quote(wrapper)}\nIcon={str(app_dir / 'icon.svg')}\n"
                     "Terminal=false\nCategories=Development;\nStartupWMClass=deepseek-harness\n"
                     "Actions=Configure;\n\n[Desktop Action Configure]\n"
                     "Name=Configure DeepSeek Harness\n"
                     f"Exec={desktop_quote(wrapper)} --configure\n",
                     encoding="utf-8")
    refresh_desktop_database(entry.parent)
    print(f"Installed desktop entry: {entry}")
    print(f"Installed command: {wrapper}")
    print("Open DeepSeek Harness from the application menu; setup appears only on first use or when needed.")


if __name__ == "__main__":
    main()
