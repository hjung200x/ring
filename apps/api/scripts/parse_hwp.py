from contextlib import closing
from pathlib import Path
from hwp5.hwp5txt import TextTransform
from hwp5.xmlmodel import Hwp5File

def extract_hwp_text(path: Path) -> str:
    text_transform = TextTransform()
    transform = text_transform.transform_hwp5_to_text
    output_path = path.with_suffix('.txt')
    with closing(Hwp5File(str(path))) as hwp5file:
        with open(output_path, 'wb') as file:
            transform(hwp5file, file)
    return output_path.read_text(encoding='utf-8', errors='replace')
