#!/usr/bin/env python3
"""One-shot, CPU-only offline transcription. Audio arrives on stdin as WAV."""

import argparse
import json
import sys
import wave
from io import BytesIO
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--language", choices=("zh", "auto", "en", "yue", "ja", "ko"), default="zh")
    args = parser.parse_args()

    import numpy as np
    import sherpa_onnx

    with wave.open(BytesIO(sys.stdin.buffer.read()), "rb") as wav:
        if (wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getcomptype()) != (1, 2, 16000, "NONE"):
            raise ValueError("Expected 16 kHz mono PCM WAV")
        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(np.float32) / 32768.0
    recognizer = sherpa_onnx.OfflineRecognizer.from_sense_voice(
        model=str(args.model_dir / "model.int8.onnx"),
        tokens=str(args.model_dir / "tokens.txt"),
        language=args.language,
        use_itn=True,
        num_threads=2,
        debug=False,
    )
    stream = recognizer.create_stream()
    stream.accept_waveform(16000, samples)
    recognizer.decode_stream(stream)
    print(json.dumps({"text": stream.result.text.strip()}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Voice transcription failed: {error}", file=sys.stderr)
        raise SystemExit(1)
