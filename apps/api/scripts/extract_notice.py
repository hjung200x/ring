import argparse
import json
import sys
from pathlib import Path

from parse_hwp import extract_hwp_text
from parse_hwpx import extract_hwpx_text


def normalize_text(raw_text: str) -> str:
    text = raw_text.replace('\r', '\n')
    lines = [line.strip() for line in text.splitlines()]
    cleaned = [line for line in lines if line]
    return '\n\n'.join(cleaned)


def build_summary(normalized_text: str) -> str:
    sections = []
    for marker in ['사업개요', '사업목적', '지원대상', '지원내용', '신청자격']:
        idx = normalized_text.find(marker)
        if idx >= 0:
            sections.append(normalized_text[idx : idx + 300])
        if len(sections) >= 3:
            break
    if not sections:
        sections = [normalized_text[:600]]
    return '\n\n'.join(sections)


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
        'summaryText': build_summary(normalized_text),
        'docType': args.type,
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == '__main__':
    main()
