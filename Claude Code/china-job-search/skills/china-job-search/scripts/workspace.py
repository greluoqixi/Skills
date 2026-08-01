#!/usr/bin/env python3
"""Initialize a local, private job-search workspace without overwriting user data."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import date
from pathlib import Path


def copy_missing(template: Path, destination: Path) -> list[str]:
    created: list[str] = []
    for source in sorted(template.rglob("*")):
        relative = source.relative_to(template)
        target = destination / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        elif not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            created.append(str(relative))
    return created


def init_workspace(destination: Path) -> dict[str, object]:
    destination = destination.resolve()
    template = Path(__file__).resolve().parent.parent / "assets" / "workspace-template"
    if not template.is_dir():
        raise FileNotFoundError(f"workspace template not found: {template}")
    destination.mkdir(parents=True, exist_ok=True)
    created = copy_missing(template, destination)
    working_copies = {
        "profile/candidate.example.md": "profile/candidate.md",
        "profile/preferences.example.md": "profile/preferences.md",
        "profile/private.example.md": "profile/private.md",
        "tracker.example.csv": "tracker.csv",
        "search/jobs.example.json": "search/jobs.json",
    }
    for example_name, working_name in working_copies.items():
        working = destination / working_name
        if not working.exists():
            working.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(destination / example_name, working)
            created.append(working_name)
    manifest = destination / "workspace.json"
    if not manifest.exists():
        manifest.write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "created": date.today().isoformat(),
                    "market": "CN-mainland",
                    "tracks": ["social", "campus", "internship", "soe"],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        created.append("workspace.json")
    return {"workspace": str(destination), "created": created, "preserved_existing": True}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    init_parser = subparsers.add_parser("init")
    init_parser.add_argument("destination", nargs="?", default="job-search-cn")
    args = parser.parse_args()
    result = init_workspace(Path(args.destination))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
