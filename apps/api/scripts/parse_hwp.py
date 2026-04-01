from __future__ import annotations

import re
from contextlib import closing
from pathlib import Path

import olefile
from hwp5.hwp5txt import TextTransform
from hwp5.xmlmodel import Hwp5File

_PLACEHOLDER_TOKENS = ('<표>', '<??>', '<?>')
_SECTION_MARKERS = (
    '사업개요',
    '사업목적',
    '지원대상',
    '지원내용',
    '신청자격',
    '공모개요',
    '사업기간',
    '신청기간',
    '접수기간',
    '공고기간',
    '추진목적',
    '과제개요',
    '연구개발',
    '지원분야',
)
_ROSTER_TERMS = (
    '명단',
    '위원',
    '전문가',
    '실무작업반',
    '소속',
    '직위',
    '직책',
    '성명',
    '연락처',
    '서명',
    '확인',
)


def _extract_hwp5_text(path: Path) -> str:
    text_transform = TextTransform()
    transform = text_transform.transform_hwp5_to_text
    output_path = path.with_suffix('.txt')
    with closing(Hwp5File(str(path))) as hwp5file:
        with open(output_path, 'wb') as file:
            transform(hwp5file, file)
    return output_path.read_text(encoding='utf-8', errors='replace')


def _extract_bodytext_text(path: Path) -> str:
    paragraphs: list[str] = []
    with closing(Hwp5File(str(path))) as hwp:
        bodytext = getattr(hwp, 'bodytext', None)
        if bodytext is None:
            return ''

        section_indexes = getattr(bodytext, 'section_indexes', lambda: [])()
        if not section_indexes:
            section_indexes = [0]

        for index in section_indexes:
            try:
                section = bodytext.section(index)
            except Exception:
                continue

            current: list[str] = []
            last_text: str | None = None
            for event, payload in section.events():
                model, attrs, _ = payload
                name = model.__name__
                event_repr = repr(event)
                if name == 'Paragraph' and 'STARTEVENT' in event_repr:
                    current = []
                    last_text = None
                    continue
                if name == 'Text':
                    text = attrs.get('text', '')
                    if text and text != last_text:
                        current.append(text)
                    last_text = text
                    continue
                if name == 'Paragraph' and 'ENDEVENT' in event_repr:
                    paragraph = ''.join(current).strip()
                    if paragraph:
                        paragraphs.append(paragraph)
                    current = []
                    last_text = None

    return '\n'.join(paragraphs)


def _extract_preview_text(path: Path) -> str:
    with olefile.OleFileIO(str(path)) as ole:
        if not ole.exists('PrvText'):
            return ''
        data = ole.openstream('PrvText').read()
    return data.decode('utf-16-le', errors='replace')


def _cleanup_text(text: str) -> str:
    text = text.replace('\r', '\n')
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line in _PLACEHOLDER_TOKENS:
            continue
        lines.append(line)
    cleaned = '\n'.join(lines)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def _looks_like_placeholder_only(text: str) -> bool:
    compact = ''.join(text.split())
    if not compact:
        return True
    stripped = compact
    for token in _PLACEHOLDER_TOKENS:
        stripped = stripped.replace(token, '')
    return len(stripped) < 20


def _narrative_line_ratio(text: str) -> float:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return 0.0

    narrative = 0
    for line in lines:
        if len(line) >= 30:
            narrative += 1
            continue
        if any(punct in line for punct in ('.', ':', '다.', '함.', '됨.')):
            narrative += 1
    return narrative / len(lines)


def _text_quality_score(text: str) -> float:
    cleaned = _cleanup_text(text)
    compact = ''.join(cleaned.split())
    if not compact:
        return -100.0

    score = 0.0
    score += min(len(compact), 6000) / 220.0

    section_hits = sum(1 for marker in _SECTION_MARKERS if marker in cleaned)
    score += section_hits * 8.0

    roster_hits = sum(cleaned.count(term) for term in _ROSTER_TERMS)
    score -= min(roster_hits, 12) * 4.0

    placeholder_hits = sum(cleaned.count(token) for token in _PLACEHOLDER_TOKENS)
    score -= placeholder_hits * 6.0

    narrative_ratio = _narrative_line_ratio(cleaned)
    score += narrative_ratio * 24.0

    if '1. 사업개요' in cleaned:
        score += 16.0
    if '1-1. 사업목적' in cleaned or '1-1. 사업목적 및 지원대상 분야' in cleaned:
        score += 12.0
    if '4-1. 지원분야' in cleaned:
        score += 8.0

    lines = [line for line in cleaned.splitlines() if line.strip()]
    if lines:
        short_lines = sum(1 for line in lines if len(line) <= 12)
        score -= (short_lines / len(lines)) * 8.0

    if _looks_like_placeholder_only(cleaned):
        score -= 50.0

    if len(compact) < 80:
        score -= 20.0

    return score


def _choose_best_text(bodytext: str, extracted: str, preview: str) -> str:
    bodytext_clean = _cleanup_text(bodytext)
    extracted_clean = _cleanup_text(extracted)
    preview_clean = _cleanup_text(preview)

    candidates = [
        ('bodytext', bodytext_clean, _text_quality_score(bodytext_clean)),
        ('extracted', extracted_clean, _text_quality_score(extracted_clean)),
        ('preview', preview_clean, _text_quality_score(preview_clean)),
    ]
    candidates = [candidate for candidate in candidates if candidate[1]]
    if not candidates:
        return ''

    candidates.sort(key=lambda item: item[2], reverse=True)
    _, best_text, best_score = candidates[0]

    if len(candidates) >= 2:
        _, alt_text, alt_score = candidates[1]
        if best_score < 8 and alt_score > 0 and alt_text not in best_text:
            merged = best_text + '\n\n' + alt_text
            if _text_quality_score(merged) > best_score + 2:
                return merged.strip()

    return best_text if best_score > -30 else ''


def extract_hwp_text(path: Path) -> str:
    bodytext = _extract_bodytext_text(path)
    extracted = _extract_hwp5_text(path)
    preview = _extract_preview_text(path)
    chosen = _choose_best_text(bodytext, extracted, preview)
    path.with_suffix('.txt').write_text(chosen, encoding='utf-8')
    return chosen
