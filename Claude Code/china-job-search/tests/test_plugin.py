from __future__ import annotations

import csv
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "china-job-search"
SCRIPTS = SKILL / "scripts"


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class PluginStructureTests(unittest.TestCase):
    def test_manifest_and_marketplace_names_are_stable(self):
        manifest = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], "china-job-search")
        self.assertEqual(manifest["version"], "0.1.0")

    def test_skill_has_complete_frontmatter_and_no_todos(self):
        text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
        self.assertTrue(text.startswith("---\nname: china-job-search\n"))
        self.assertIn("description:", text.split("---", 2)[1])
        self.assertNotIn("TODO", text)

    def test_all_commands_reference_the_skill(self):
        commands = sorted((ROOT / "commands").glob("*.md"))
        self.assertEqual(len(commands), 12)
        for command in commands:
            text = command.read_text(encoding="utf-8")
            self.assertIn("china-job-search", text, command.name)

    def test_references_and_assets_exist(self):
        expected_refs = {"application.md", "documents.md", "evaluation.md", "interview-offer.md", "platforms.md", "safety.md", "tracking.md", "workspace.md"}
        self.assertEqual({path.name for path in (SKILL / "references").glob("*.md")}, expected_refs)
        self.assertTrue((SKILL / "assets" / "latex" / "resume-cn.tex").is_file())
        self.assertTrue((SKILL / "assets" / "latex" / "cover-letter-cn.tex").is_file())


class ScriptTests(unittest.TestCase):
    def test_workspace_init_preserves_existing_files(self):
        workspace = load_module("workspace")
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "job-search-cn"
            target.mkdir()
            existing = target / "profile" / "candidate.example.md"
            existing.parent.mkdir()
            existing.write_text("keep me\n", encoding="utf-8")
            first = workspace.init_workspace(target)
            second = workspace.init_workspace(target)
            self.assertEqual(existing.read_text(encoding="utf-8"), "keep me\n")
            self.assertIn("workspace.json", first["created"])
            self.assertTrue((target / "profile" / "candidate.md").is_file())
            self.assertTrue((target / "tracker.csv").is_file())
            self.assertTrue((target / "search" / "jobs.json").is_file())
            self.assertEqual(second["created"], [])

    def test_job_store_deduplicates_tracking_urls(self):
        job_store = load_module("job_store")
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            incoming = root / "incoming.json"
            store = root / "jobs.json"
            incoming.write_text(
                json.dumps(
                    [
                        {"company": "示例公司", "title": "算法工程师", "city": "上海", "url": "https://example.cn/job/1?utm_source=x", "track": "social"},
                        {"company": "示例公司", "title": "算法工程师", "city": "上海", "url": "https://example.cn/job/1?from=feed", "track": "social", "deadline": "2026-08-31"},
                    ],
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            result = job_store.merge(store, incoming)
            saved = json.loads(store.read_text(encoding="utf-8"))["jobs"]
            self.assertEqual(result["total"], 1)
            self.assertEqual(saved[0]["url"], "https://example.cn/job/1")
            self.assertEqual(saved[0]["deadline"], "2026-08-31")

    def test_character_counter_handles_chinese_and_english(self):
        count_text = load_module("count_text")
        result = count_text.measure("你好 AI engineer")
        self.assertEqual(result["characters"], 14)
        self.assertEqual(result["words"], 4)

    def test_report_omits_notes_and_document_contents(self):
        report = load_module("report")
        with tempfile.TemporaryDirectory() as temp:
            tracker = Path(temp) / "tracker.csv"
            with tracker.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["id", "company", "role", "status", "notes"])
                writer.writeheader()
                writer.writerow({"id": "1", "company": "示例公司", "role": "工程师", "status": "applied", "notes": "身份证号秘密"})
            html = report.render(tracker)
            self.assertIn("示例公司", html)
            self.assertNotIn("身份证号秘密", html)


if __name__ == "__main__":
    unittest.main()
