"""Static regression checks for the fictional, in-memory demo."""

from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import urlsplit


DEMO = Path(__file__).resolve().parents[1] / "demo"


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.tags = []
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class PrivacyTests(unittest.TestCase):
    def test_page_policy(self):
        tags = Page(DEMO / "index.html").tags
        policies = [
            (i, attrs["content"]) for i, (tag, attrs) in enumerate(tags)
            if tag == "meta" and attrs.get("http-equiv", "").lower() == "content-security-policy"
        ]
        self.assertEqual(len(policies), 1)
        index, content = policies[0]
        self.assertFalse(any(tag in {"script", "link", "img"} for tag, _ in tags[:index]))
        directives = {}
        for part in content.split(";"):
            if part.strip():
                name, *sources = part.split()
                self.assertNotIn(name, directives)
                directives[name] = sources
        for name in ("default-src", "connect-src", "form-action", "base-uri", "object-src"):
            self.assertEqual(directives.get(name), ["'none'"], name)
        for name, sources in directives.items():
            allowed = [["'none'"], ["'self'"]] if name in {"style-src", "script-src", "img-src"} else [["'none'"]]
            self.assertIn(sources, allowed, name)

    def assert_bundled(self, address, base):
        url = urlsplit(address)
        self.assertFalse(url.scheme or url.netloc or address.startswith(("/", "\\")), address)
        path = (base / url.path).resolve()
        self.assertTrue(path.is_relative_to(DEMO.resolve()) and path.is_file(), address)

    def test_page_and_styles_use_bundled_assets(self):
        for tag, attrs in Page(DEMO / "index.html").tags:
            for key in ("src", "href", "action", "poster"):
                if key in attrs and not attrs[key].startswith("#"):
                    self.assert_bundled(attrs[key], DEMO)
            for candidate in attrs.get("srcset", "").split(","):
                if candidate.strip():
                    self.assert_bundled(candidate.split()[0], DEMO)
        for sheet in DEMO.rglob("*.css"):
            css = sheet.read_text(encoding="utf-8")
            for _, address in re.findall(r"""(?i)@import\s+(["'])(.*?)\1""", css):
                self.assert_bundled(address, sheet.parent)
            for _, address in re.findall(r"""(?i)url\(\s*(["']?)(.*?)\1\s*\)""", css):
                self.assert_bundled(address, sheet.parent)

    def test_scripts_avoid_transmission_storage_and_telemetry(self):
        # These catch common accidental additions. They do not replace runtime checks.
        indicators = {
            "network": r"\bfetch\s*\(|\b(XMLHttpRequest|WebSocket|EventSource|WebTransport|sendBeacon|RTCPeerConnection)\b",
            "storage": r"\b(localStorage|sessionStorage|indexedDB|caches|serviceWorker|cookieStore|document\s*\.\s*cookie)\b",
            "telemetry": r"\b(gtag|dataLayer|Sentry|posthog|mixpanel|analytics|console\s*\.\s*(log|info|debug|table|dir))\b",
        }
        scripts = [p for p in DEMO.rglob("*") if p.suffix in {".js", ".mjs"}]
        self.assertTrue(scripts)
        for path in scripts:
            code = path.read_text(encoding="utf-8")
            for name, pattern in indicators.items():
                with self.subTest(script=path.name, check=name):
                    self.assertNotRegex(code, pattern)


if __name__ == "__main__":
    unittest.main()
