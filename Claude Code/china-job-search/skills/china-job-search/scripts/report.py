#!/usr/bin/env python3
"""Generate a self-contained, privacy-limited HTML dashboard from tracker.csv."""

from __future__ import annotations

import argparse
import csv
import html
from collections import Counter
from datetime import date
from pathlib import Path


def render(tracker: Path) -> str:
    with tracker.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    statuses = Counter((row.get("status") or "unknown").strip() for row in rows)
    cards = "".join(
        f'<div class="card"><strong>{html.escape(status)}</strong><span>{count}</span></div>'
        for status, count in sorted(statuses.items())
    )
    safe_columns = ["id", "company", "role", "city", "track", "source", "status", "stage", "fit_score", "applied_date", "next_action"]
    head = "".join(f"<th>{html.escape(name)}</th>" for name in safe_columns)
    body = "".join(
        "<tr>" + "".join(f"<td>{html.escape(str(row.get(name, '')))}</td>" for name in safe_columns) + "</tr>"
        for row in rows
    )
    return f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>求职进展报告</title><style>
body{{font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;margin:2rem;color:#172033;background:#f5f7fb}}
h1{{margin-bottom:.25rem}}.meta{{color:#667085}}.cards{{display:flex;gap:1rem;flex-wrap:wrap;margin:1.5rem 0}}
.card{{background:white;border:1px solid #e4e7ec;border-radius:10px;padding:1rem;min-width:120px;display:flex;justify-content:space-between;gap:1rem}}
table{{width:100%;border-collapse:collapse;background:white;font-size:.9rem}}th,td{{padding:.65rem;border:1px solid #e4e7ec;text-align:left}}th{{background:#eef2f8}}
</style></head><body><h1>求职进展报告</h1><p class="meta">生成日期：{date.today().isoformat()}　申请记录：{len(rows)}</p>
<div class="cards">{cards}</div><div style="overflow:auto"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>
</body></html>"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tracker")
    parser.add_argument("output", nargs="?")
    args = parser.parse_args()
    tracker = Path(args.tracker)
    output = Path(args.output) if args.output else tracker.parent / "reports" / f"report-{date.today().isoformat()}.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render(tracker), encoding="utf-8")
    print(output.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
