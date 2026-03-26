from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

def extract_hwpx_text(path: Path) -> str:
    texts: list[str] = []
    with ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.endswith('.xml'):
                continue
            data = archive.read(name)
            try:
                root = ET.fromstring(data)
            except ET.ParseError:
                continue
            for node in root.iter():
                if node.text and node.text.strip():
                    texts.append(node.text.strip())
    return '\n'.join(texts)
