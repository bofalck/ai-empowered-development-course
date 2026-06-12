import json
import os
import re
import time
from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

NETLIGHT_URL = "https://llm.netlight.ai/v1/chat/completions"
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")

ANALYSIS_PROMPT = """Analyze this meeting transcript and provide:

1. EXECUTIVE SUMMARY: 2-3 key points from the meeting
2. ACTION ITEMS: List of specific tasks/decisions with owners if mentioned
3. SENTIMENT: Overall tone (Positive/Neutral/Negative) with brief explanation
4. SUGGESTED TAGS: 3-5 relevant tags that categorize this meeting (e.g., "Planning", "Product", "Decision", "Urgent", "Follow-up")

Format your response as valid JSON with these keys: "summary" (string), "action_items" (array of strings), "sentiment" (string), "suggested_tags" (array of strings).

Transcript:
{transcript}"""


def _call_gpt(transcript: str) -> dict:
    payload = json.dumps({
        "model": "gpt-5",
        "messages": [{"role": "user", "content": ANALYSIS_PROMPT.format(transcript=transcript)}],
        "max_tokens": 4096,
    }).encode()

    req = Request(
        NETLIGHT_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {OPENAI_KEY}",
        },
        method="POST",
    )
    with urlopen(req, timeout=120) as resp:
        api_response = json.loads(resp.read())

    response_text = api_response["choices"][0]["message"]["content"]

    # Extract JSON from response
    json_match = re.search(r"\{[\s\S]*\}", response_text)
    if json_match:
        return json.loads(json_match.group(0))

    return {"error": "Failed to parse analysis", "raw": response_text}


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

        transcript = body.get("transcript", "").strip()

        if not transcript:
            self._json(400, {"error": "transcript is required"})
            return

        if not OPENAI_KEY:
            self._json(500, {"error": "OPENAI_API_KEY not configured on server"})
            return

        attempts = 0
        last_error = None
        while attempts < 2:
            try:
                result = _call_gpt(transcript)
                self._json(200, result)
                return
            except HTTPError as e:
                status = e.code
                if status == 429 and attempts == 0:
                    time.sleep(3)
                    attempts += 1
                    last_error = "Rate limit (429)"
                    continue
                elif status == 401:
                    self._json(401, {"error": "Invalid API key"})
                    return
                else:
                    self._json(502, {"error": f"GPT API error: {status}"})
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

        self._json(500, {"error": last_error or "Analysis failed"})

    def _json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass
