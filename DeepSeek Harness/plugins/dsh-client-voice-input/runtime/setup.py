#!/usr/bin/env python3
"""Install the local ASR runtime and a pinned upstream model on demand.

The plugin decides which engine, archive, and file names to request; this script
only owns the mechanics (private venv, constrained download, extraction).
"""

import argparse
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
import venv
from pathlib import Path


MAX_ARCHIVE_BYTES = 600_000_000
MIN_MODEL_BYTES = 1_000_000
MAX_FILE_BYTES = 400_000_000
PINNED_SOURCE = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/"


def python_in(venv_dir):
    return venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def ensure_runtime(venv_dir):
    python = python_in(venv_dir)
    if not python.is_file():
        venv.EnvBuilder(with_pip=True, clear=False).create(venv_dir)
    check = subprocess.run([str(python), "-c", "import sherpa_onnx, numpy"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    if check.returncode:
        subprocess.run([str(python), "-m", "pip", "install", "sherpa-onnx>=1.10,<2", "numpy>=1.23,<3"], check=True)
        subprocess.run([str(python), "-c", "import sherpa_onnx, numpy"], check=True)


def download_model(url, model_dir, file_names):
    if all((model_dir / name).is_file() for name in file_names):
        return
    if not url.startswith(PINNED_SOURCE):
        raise ValueError("Model source is not the pinned upstream release")
    wanted = set(file_names)
    model_dir.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="voice-model-", dir=model_dir.parent) as temp:
        temp_dir = Path(temp)
        archive_path = temp_dir / "model.tar.bz2"
        request = urllib.request.Request(url, headers={"User-Agent": "dsh-client-voice-input/0.1"})
        with urllib.request.urlopen(request, timeout=60) as response, archive_path.open("wb") as output:
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_ARCHIVE_BYTES:
                    raise ValueError("Model archive exceeds size limit")
                output.write(chunk)
        with tarfile.open(archive_path, "r:bz2") as archive:
            members = {Path(member.name).name: member for member in archive.getmembers()
                       if member.isfile() and Path(member.name).name in wanted}
            if set(members) != wanted:
                raise ValueError("Model archive is missing required files")
            for name, member in members.items():
                if member.size > MAX_FILE_BYTES:
                    raise ValueError("Model file exceeds size limit")
                source = archive.extractfile(member)
                if source is None:
                    raise ValueError("Model file could not be read")
                with source, (temp_dir / name).open("wb") as output:
                    shutil.copyfileobj(source, output)
        extracted = sum((temp_dir / name).stat().st_size for name in file_names)
        if extracted < MIN_MODEL_BYTES:
            raise ValueError("Downloaded model is unexpectedly small")
        model_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        for name in file_names:
            os.replace(temp_dir / name, model_dir / name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--model-url", required=True)
    parser.add_argument("--files", default="model.int8.onnx,tokens.txt")
    args = parser.parse_args()
    file_names = [name.strip() for name in args.files.split(",") if name.strip()]
    if not file_names:
        raise ValueError("No model files requested")
    args.data_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    ensure_runtime(args.data_dir / "venv")
    download_model(args.model_url, args.model_dir, file_names)
    print("Ready")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Voice setup failed: {error}", file=sys.stderr)
        raise SystemExit(1)
