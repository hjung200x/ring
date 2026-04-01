from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from parse_hwp import extract_hwp_text
from parse_hwpx import extract_hwpx_text

_SECTION_MARKERS = ['사업개요', '사업목적', '지원대상', '지원내용', '신청자격']
_ROSTER_TERMS = ['명단', '위원', '전문가', '소속', '직위', '성명', '서명']
_BUSINESS_SECTION_START = re.compile(r'(?:(?<=\n\n)|^)1\.\s*사업개요')
_BUSINESS_SECTION_END = re.compile(r'(?:(?<=\n\n)|^)2\.\s*사업추진체계|(?:(?<=\n\n)|^)2\.\s*')


def normalize_text(raw_text: str) -> str:
    text = raw_text.replace('\r', '\n')
    lines = [line.strip() for line in text.splitlines()]
    cleaned: list[str] = []
    for line in lines:
        if not line:
            continue
        if line in {'<??>', '<?>', '<표>'}:
            continue
        cleaned.append(line)
    normalized = '\n\n'.join(cleaned)
    return re.sub(r'\n{3,}', '\n\n', normalized).strip()


def _paragraph_score(paragraph: str) -> float:
    score = 0.0
    text = paragraph.strip()
    if not text:
        return -100.0

    score += min(len(text), 1200) / 80.0
    score += sum(1 for marker in _SECTION_MARKERS if marker in text) * 8.0
    score -= sum(text.count(term) for term in _ROSTER_TERMS) * 4.0

    if any(token in text for token in ('.', ':', '기간', '지원', '연구', '사업')):
        score += 4.0

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if lines:
        short_line_ratio = sum(1 for line in lines if len(line) <= 12) / len(lines)
        score -= short_line_ratio * 10.0

    if len(''.join(text.split())) < 80:
        score -= 10.0

    return score


def build_summary(normalized_text: str) -> str:
    if not normalized_text.strip():
        return ''

    sections: list[str] = []
    for marker in _SECTION_MARKERS:
        idx = normalized_text.find(marker)
        if idx >= 0:
            snippet = normalized_text[idx : idx + 350].strip()
            if snippet and snippet not in sections:
                sections.append(snippet)
        if len(sections) >= 3:
            break
    if sections:
        return '\n\n'.join(sections)

    paragraphs = [p.strip() for p in normalized_text.split('\n\n') if p.strip()]
    scored = sorted(
        ((paragraph, _paragraph_score(paragraph)) for paragraph in paragraphs),
        key=lambda item: item[1],
        reverse=True,
    )
    informative = [paragraph for paragraph, score in scored if score >= 6][:3]
    return '\n\n'.join(informative)


def extract_business_overview(normalized_text: str) -> str:
    if not normalized_text.strip():
        return ''

    candidates: list[tuple[str, float]] = []
    starts = list(_BUSINESS_SECTION_START.finditer(normalized_text))
    for start_match in starts:
        start = start_match.start()
        following = normalized_text[start_match.end() :]
        end_match = _BUSINESS_SECTION_END.search(following)
        end = start + end_match.start() if end_match else len(normalized_text)
        block = normalized_text[start:end].strip()
        if not block:
            continue
        paragraphs = [paragraph for paragraph in block.split('\n\n') if paragraph.strip()]
        score = sum(_paragraph_score(paragraph) for paragraph in paragraphs[:8])
        score += min(len(block), 2500) / 120.0
        if '1-1.' in block or '1-1' in block:
            score += 12.0
        if '1-2.' in block or '1-2' in block:
            score += 8.0
        candidates.append((block, score))

    if candidates:
        candidates.sort(key=lambda item: item[1], reverse=True)
        return candidates[0][0]

    return build_summary(normalized_text)


def main() -> None:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--type', required=True, choices=['hwp', 'hwpx'])
    args = parser.parse_args()

    path = Path(args.input)
    raw_text = extract_hwp_text(path) if args.type == 'hwp' else extract_hwpx_text(path)
    normalized_text = normalize_text(raw_text)
    payload = {
        'rawText': raw_text,
        'normalizedText': normalized_text,
        'summaryText': extract_business_overview(normalized_text),
        'docType': args.type,
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == '__main__':
    main()
