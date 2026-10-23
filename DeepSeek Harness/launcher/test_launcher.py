"""Focused checks for the launcher handoff and process cleanup."""

import importlib.util
import fcntl
import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("dsh_launcher", ROOT / "launcher.py")
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
    def test_installed_uninstaller_waits_for_closed_app_and_removes_owned_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            env = {**os.environ, "XDG_DATA_HOME": str(root / "data"),
                   "XDG_BIN_HOME": str(root / "bin"), "XDG_CONFIG_HOME": str(root / "config"),
                   "XDG_STATE_HOME": str(root / "state")}
            subprocess.run([sys.executable, str(ROOT / "install.py")], env=env,
                           capture_output=True, check=True)
            wrapper = root / "bin/deepseek-harness-launcher"
            config = root / "config/deepseek-harness-launcher/config.json"
            config.parent.mkdir(parents=True)
            config.write_text("{}")
            lock_path = root / "state/deepseek-harness-launcher/launcher.lock"
            lock_path.parent.mkdir(parents=True)
            with lock_path.open("a+") as lock:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                blocked = subprocess.run([str(wrapper), "--uninstall"], env=env,
                                         capture_output=True, text=True, check=False)
                self.assertNotEqual(blocked.returncode, 0)
                self.assertTrue(wrapper.exists())
            subprocess.run([str(wrapper), "--uninstall"], env=env, capture_output=True, check=True)
            self.assertFalse(wrapper.exists())
            self.assertFalse(config.exists())
            self.assertFalse((root / "data/deepseek-harness-launcher").exists())
            self.assertFalse((root / "state/deepseek-harness-launcher").exists())

    def test_setup_only_on_first_launch_or_unrecoverable_dependencies(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            node, dsh, browser = (root / name for name in ("node", "dsh", "chrome"))
            node.write_text("#!/bin/sh\necho v24.0.0\n")
            dsh.write_text("#!/bin/sh\nexit 0\n")
            browser.write_text("#!/bin/sh\nexit 0\n")
            for path in (node, dsh, browser):
                path.chmod(0o755)
            good = {"node": str(node), "dsh": str(dsh), "browser": str(browser)}
            with patch.object(launcher, "discover_config", return_value=good):
                self.assertTrue(launcher.startup_config(None)[3])
                self.assertFalse(launcher.startup_config(good)[3])
                moved = {**good, "dsh": str(root / "missing-dsh")}
                config, _, problems, needs_setup = launcher.startup_config(moved)
                self.assertFalse(needs_setup)
                self.assertFalse(problems)
                self.assertEqual(config["dsh"], str(dsh))
            with patch.object(launcher, "discover_config", return_value={**good, "dsh": ""}):
                self.assertTrue(launcher.startup_config(moved)[3])

    def test_dependency_check_rejects_unsupported_node(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            node, dsh, browser = (root / name for name in ("node", "dsh", "chrome"))
            for path in (dsh, browser):
                path.write_text("#!/bin/sh\nexit 0\n")
                path.chmod(0o755)
            config = {"node": str(node), "dsh": str(dsh), "browser": str(browser)}
            for version, expected in (("v20.20.2", False), ("v22.18.0", False),
                                      ("v22.19.0", True), ("v24.0.0", True)):
                node.write_text(f"#!/bin/sh\necho {version}\n")
                node.chmod(0o755)
                with self.subTest(version=version):
                    found, problems = launcher.check_config(config)
                    self.assertEqual(not problems, expected)
                    self.assertEqual("node" in found, expected)

    def test_startup_url_accepts_only_local_dsh_web(self):
        valid = "dsh web: http://127.0.0.1:38491/?token=secret"
        self.assertEqual(launcher.startup_url(valid), valid.removeprefix("dsh web: "))
        self.assertIsNone(launcher.startup_url("ordinary startup message"))
        for bad in ("dsh web: http://example.com:1234/?token=x",
                    "dsh web: http://127.0.0.1/", "dsh web: https://127.0.0.1:1234/"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                launcher.startup_url(bad)
        self.assertNotIn("secret", launcher.safe_message(valid))

    def test_terminate_group_cleans_child_after_parent_exits(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / "child.pid"
            parent = subprocess.Popen([sys.executable, "-c",
                "import subprocess,sys; p=subprocess.Popen([sys.executable,'-c','import time; time.sleep(30)']); open(sys.argv[1],'w').write(str(p.pid))",
                str(marker)], start_new_session=True)
            parent.wait(timeout=5)
            deadline = time.monotonic() + 3
            while not marker.exists() and time.monotonic() < deadline:
                time.sleep(.01)
            child_pid = int(marker.read_text())
            try:
                launcher.terminate_group(parent)
                deadline = time.monotonic() + 3
                while time.monotonic() < deadline:
                    try:
                        state = Path(f"/proc/{child_pid}/stat").read_text().split()[2]
                        if state == "Z":
                            break
                    except FileNotFoundError:
                        break
                    time.sleep(.05)
                else:
                    self.fail("child process stayed running")
            finally:
                try:
                    os.kill(child_pid, 9)
                except ProcessLookupError:
                    pass


if __name__ == "__main__":
    unittest.main()
