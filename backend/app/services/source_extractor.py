import hashlib
import re
from datetime import datetime, date
from typing import Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup
from app.core.security import is_safe_url

class SourceExtractor:
    """
    Safely fetches and extracts text content from URLs with SSRF protection,
    stripping HTML boilerplate, computing SHA-256 content hashes, and detecting publication dates.
    """
    @staticmethod
    async def extract_from_url(url: str) -> Dict[str, Any]:
        if not is_safe_url(url):
            raise ValueError(f"Blocked URL due to security restrictions: {url}")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 VERITYX-Research-Bot/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            raw_text = response.text

            soup = BeautifulSoup(raw_text, "html.parser")

            # Remove scripts, styles, navs, footers
            for tag in soup(["script", "style", "noscript", "iframe", "svg", "nav", "footer", "header"]):
                tag.decompose()

            # Extract title
            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else url

            # Extract text
            paragraphs = [p.get_text(strip=True) for p in soup.find_all(["p", "h1", "h2", "h3", "h4", "li", "td"]) if p.get_text(strip=True)]
            extracted_text = "\n\n".join(paragraphs)

            # Limit text length to 25,000 characters
            extracted_text = extracted_text[:25000]

            # Content hash
            content_hash = hashlib.sha256(extracted_text.encode("utf-8")).hexdigest()

            # Attempt date extraction
            pub_date = SourceExtractor._detect_date(soup, extracted_text)

            return {
                "url": url,
                "title": title,
                "source_type": "pdf" if "application/pdf" in content_type else "webpage",
                "source_content": extracted_text,
                "content_hash": content_hash,
                "publication_date": pub_date,
            }

    @staticmethod
    def _detect_date(soup: BeautifulSoup, text: str) -> Optional[date]:
        # Try meta tags
        meta_keys = ["article:published_time", "pubdate", "date", "DC.date.issued"]
        for key in meta_keys:
            tag = soup.find("meta", attrs={"name": key}) or soup.find("meta", attrs={"property": key})
            if tag and tag.get("content"):
                try:
                    dt = datetime.fromisoformat(tag["content"].split("T")[0])
                    return dt.date()
                except Exception:
                    pass

        # Regex search for common date formats
        patterns = [
            r'(\d{4}-\d{2}-\d{2})',
            r'(\d{2}/\d{2}/\d{4})',
            r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}'
        ]
        for pattern in patterns:
            match = re.search(pattern, text[:2000], re.IGNORECASE)
            if match:
                try:
                    s = match.group(0)
                    if '-' in s:
                        return datetime.strptime(s, "%Y-%m-%d").date()
                    elif '/' in s:
                        return datetime.strptime(s, "%d/%m/%Y").date()
                except Exception:
                    pass
        return None

source_extractor = SourceExtractor()

