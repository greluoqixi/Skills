#!/usr/bin/env python3
"""Count Unicode characters, non-whitespace characters, lines, and words."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def measure(text: str) -> dict[str, int]:
    return {
        "characters": len(text),
        "characters_no_whitespace": len(re.sub(r"\s", "", text)),
        "words": len(re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*|[\u3400-\u9fff]", text)),
        "lines": len(text.splitlines()) or 1,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?")
    parser.add_argument("--text")
    args = parser.parse_args()
    if bool(args.file) == bool(args.text is not None):
        parser.error("provide exactly one of FILE or --text")
    text = Path(args.file).read_text(encoding="utf-8") if args.file else args.text
    print(json.dumps(measure(text), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
