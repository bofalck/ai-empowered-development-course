import json
import os
import time
from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
import io

NETLIGHT_URL = "https://llm.netlight.ai/v1/audio/transcriptions"
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
CHUNK_SIZE_BYTES = 20 * 1024 * 1024  # 20MB


def _transcribe_bytes(audio_bytes: bytes, filename: str, language: str) -> dict:
    """Call Whisper API with raw bytes. Returns dict with 'text' and 'segments'."""
    boundary = b"----TranscriberBoundary"
    body = (
        b"--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="file"; filename="' + filename.encode() + b'"\r\n'
        b"Content-Type: audio/webm\r\n\r\n"
        + audio_bytes
        + b"\r\n--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n'
        b"--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="language"\r\n\r\n' + language.encode() + b"\r\n"
        b"--" + boundary + b"\r\n"
        b'Content-Disposition: form-data; name="temperature"\r\n\r\n0\r\n'
        b"--" + boundary + b"--\r\n"
    )
    req = Request(
        NETLIGHT_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {OPENAI_KEY}",
            "Content-Type": f"multipart/form-data; boundary={boundary.decode()}",
        },
        method="POST",
    )
    with urlopen(req, timeout=180) as resp:
        result = json.loads(resp.read())
    return result


def _transcribe_chunked(audio_bytes: bytes, language: str) -> dict:
    """Split bytes into chunks and concatenate transcripts. Returns merged dict."""
    chunks = [
        audio_bytes[i:i + CHUNK_SIZE_BYTES]
        for i in range(0, len(audio_bytes), CHUNK_SIZE_BYTES)
    ]
    texts = []
    all_segments = []
    offset = 0
    for i, chunk in enumerate(chunks):
        filename = f"audio_chunk_{i}.webm"
        result = _transcribe_bytes(chunk, filename, language)
        texts.append(result.get("text", ""))
        for seg in result.get("segments", []):
            seg = dict(seg)
            seg["start"] = seg.get("start", 0) + offset
            seg["end"] = seg.get("end", 0) + offset
            all_segments.append(seg)
        # Rough offset estimate: assume ~64kbps
        offset += len(chunk) / (64 * 1024 / 8)
    return {"text": "\n".join(texts), "segments": all_segments}


def _download_audio(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": "Transcriber/1.0"})
    with urlopen(req, timeout=60) as resp:
        return resp.read()


def _call_transcribe(audio_url: str, language: str) -> dict:
    audio_bytes = _download_audio(audio_url)
    if len(audio_bytes) > CHUNK_SIZE_BYTES:
        return _transcribe_chunked(audio_bytes, language)
    return _transcribe_bytes(audio_bytes, "audio.webm", language)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._json(400, {"error": "Invalid JSON body"})
            return

        audio_url = body.get("audio_url", "").strip()
        language = body.get("language", "en").strip() or "en"

        if not audio_url:
            self._json(400, {"error": "audio_url is required"})
            return

        if not OPENAI_KEY:
            self._json(500, {"error": "OPENAI_API_KEY not configured on server"})
            return

        attempts = 0
        last_error = None
        while attempts < 2:
            try:
                result = _call_transcribe(audio_url, language)
                self._json(200, result)
                return
            except HTTPError as e:
                status = e.code
                if status == 429 and attempts == 0:
                    time.sleep(3)
                    attempts += 1
                    last_error = f"Rate limit (429)"
                    continue
                elif status == 413:
                    self._json(413, {"error": "Recording too large for transcription API"})
                    return
                elif status == 401:
                    self._json(401, {"error": "Invalid API key"})
                    return
                else:
                    self._json(502, {"error": f"Whisper API error: {status}"})
                    return
            except URLError as e:
                last_error = str(e)
                if attempts == 0:
                    attempts += 1
                    continue
                break
            except Exception as e:
                last_error = str(e)
                break

        self._json(500, {"error": last_error or "Transcription failed"})

    def _json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # suppress default Apache-style logs
