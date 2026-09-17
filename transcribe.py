#!/usr/bin/env python3
"""Transcribe audio (any format) with faster-whisper (tiny model — free, unlimited).
Usage: python3 transcribe.py <file> [lang]
Prints JSON: {"text": "...", "lang": "en", "duration": 3.2}
"""
import sys, json, subprocess, tempfile, os
from faster_whisper import WhisperModel

_model = None
def get_model():
    global _model
    if _model is None:
        _model = WhisperModel("tiny", device="cpu", compute_type="int8")
    return _model

def main():
    path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else None
    # Convert to 16k mono WAV first — fixes empty transcription on Telegram ogg/opus
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp.close()
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',path,'-ar','16000','-ac','1',tmp.name], check=True)
    model = get_model()
    kwargs = {"beam_size": 1}
    if lang in ("en","ar","ru"):
        kwargs["language"] = lang
    segs, info = model.transcribe(tmp.name, **kwargs)
    text = " ".join(s.text for s in segs).strip()
    os.unlink(tmp.name)
    print(json.dumps({"text": text, "lang": info.language, "duration": round(info.duration,1)}))

if __name__ == "__main__":
    main()
