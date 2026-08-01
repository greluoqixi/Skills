#!/usr/bin/env python3
"""Normalize and deduplicate job records into a stable JSON store."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

TRACKING_KEYS = {
    "from",
    "ka",
    "ref",
    "sid",
    "source",
    "spm",
    "utm_campaign",
    "utm_medium",
    "utm_source",
}
VALID_TRACKS = {"social", "campus", "internship", "soe"}


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def canonical_url(raw: object) -> str:
    value = clean(raw)
    if not value:
        return ""
    parts = urlsplit(value)
    query = [(key, val) for key, val in parse_qsl(parts.query) if key.lower() not in TRACKING_KEYS]
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), urlencode(query), ""))


def record_key(record: dict[str, object]) -> str:
    url = canonical_url(record.get("url"))
    if url:
        return f"url:{url}"
    values = [clean(record.get(name)).casefold() for name in ("company", "title", "city")]
    if not values[0] or not values[1]:
        raise ValueError("each job requires url or both company and title")
    return "job:" + "|".join(values)


def normalize(record: dict[str, object]) -> dict[str, object]:
    track = clean(record.get("track") or "social").lower()
    if track not in VALID_TRACKS:
        raise ValueError(f"invalid track {track!r}; expected one of {sorted(VALID_TRACKS)}")
    normalized: dict[str, object] = {
        "title": clean(record.get("title")),
        "company": clean(record.get("company")),
        "city": clean(record.get("city")),
        "url": canonical_url(record.get("url")),
        "source": clean(record.get("source")),
        "track": track,
        "published": clean(record.get("published")),
        "deadline": clean(record.get("deadline")),
        "fit": clean(record.get("fit") or "unrated").lower(),
        "status": clean(record.get("status") or "discovered").lower(),
        "first_seen": clean(record.get("first_seen") or date.today().isoformat()),
    }
    for optional in ("jd_text", "requirements", "risk_flags", "score", "verdict", "notes"):
        if optional in record:
            normalized[optional] = record[optional]
    normalized["id"] = clean(record.get("id")) or record_key(normalized)
    return normalized


def load_records(path: Path) -> list[dict[str, object]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "jobs" in data:
        data = data["jobs"]
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ValueError("input must be a job object, a list of job objects, or {'jobs': [...]}")
    return data


def merge(store_path: Path, input_path: Path) -> dict[str, int]:
    existing: list[dict[str, object]] = []
    if store_path.exists():
        existing = load_records(store_path)
    keyed = {record_key(item): item for item in existing}
    added = updated = 0
    for raw in load_records(input_path):
        item = normalize(raw)
        key = record_key(item)
        if key in keyed:
            preserved = dict(keyed[key])
            preserved.update({k: v for k, v in item.items() if v not in ("", None, [], {})})
            keyed[key] = preserved
            updated += 1
        else:
            keyed[key] = item
            added += 1
    store_path.parent.mkdir(parents=True, exist_ok=True)
    ordered = sorted(keyed.values(), key=lambda item: (str(item.get("first_seen", "")), str(item.get("company", ""))), reverse=True)
    store_path.write_text(json.dumps({"schema_version": 1, "jobs": ordered}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"added": added, "updated": updated, "total": len(ordered)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("store")
    parser.add_argument("input")
    args = parser.parse_args()
    print(json.dumps(merge(Path(args.store), Path(args.input)), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
