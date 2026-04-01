from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

_SECTION_NAME_RE = re.compile(r'Contents/section(\d+)\.xml$')


def _sorted_section_xml_names(names: list[str]) -> list[str]:
    section_names: list[tuple[int, str]] = []
    for name in names:
        match = _SECTION_NAME_RE.search(name)
        if match:
            section_names.append((int(match.group(1)), name))
    section_names.sort(key=lambda item: item[0])
    return [name for _, name in section_names]


def _iter_visible_text(root: ET.Element):
    for node in root.iter():
        if node.text and node.text.strip():
            yield node.text.strip()
        if node.tail and node.tail.strip():
            yield node.tail.strip()


def extract_hwpx_text(path: Path) -> str:
    texts: list[str] = []
    with ZipFile(path) as archive:
        names = archive.namelist()
        section_names = _sorted_section_xml_names(names)
        target_names = section_names or [name for name in names if name.endswith('.xml')]

        for name in target_names:
            data = archive.read(name)
            try:
                root = ET.fromstring(data)
            except ET.ParseError:
                continue
            texts.extend(_iter_visible_text(root))

    cleaned: list[str] = []
    for text in texts:
        text = text.strip()
        if not text:
            continue
        cleaned.append(text)
    return '\n'.join(cleaned)
