#!/usr/bin/env python3
"""Verify PDF page count and extractable text with Poppler utilities."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def command_output(command: list[str]) -> str:
    result = subprocess.run(command, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.stdout


def verify(pdf: Path, pages: set[int] | None, required: list[str], min_chars: int) -> list[str]:
    errors: list[str] = []
    if not pdf.is_file():
        return [f"missing PDF: {pdf}"]
    for tool in ("pdfinfo", "pdftotext"):
        if not shutil.which(tool):
            return [f"required tool not found: {tool}"]
    info = command_output(["pdfinfo", str(pdf)])
    match = re.search(r"^Pages:\s+(\d+)$", info, re.MULTILINE)
    actual_pages = int(match.group(1)) if match else 0
    if pages and actual_pages not in pages:
        errors.append(f"page count {actual_pages} not in {sorted(pages)}")
    with tempfile.TemporaryDirectory(prefix="china-job-search-") as temp_dir:
        target = Path(temp_dir) / "text.txt"
        subprocess.run(["pdftotext", "-layout", str(pdf), str(target)], check=True)
        text = target.read_text(encoding="utf-8", errors="replace")
    compact = re.sub(r"\s", "", text)
    if len(compact) < min_chars:
        errors.append(f"only {len(compact)} non-whitespace characters extracted; expected at least {min_chars}")
    if "�" in text or re.search(r"\(cid:\d+\)", text):
        errors.append("text layer contains replacement or cid markers")
    for value in required:
        if value not in text:
            errors.append(f"required text not found: {value!r}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--pages", default="")
    parser.add_argument("--contains", action="append", default=[])
    parser.add_argument("--min-chars", type=int, default=50)
    args = parser.parse_args()
    pages = {int(value) for value in args.pages.split(",") if value.strip()} or None
    errors = verify(Path(args.pdf), pages, args.contains, args.min_chars)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(f"OK: {args.pdf}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
