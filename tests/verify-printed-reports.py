"""Optional maintainer check: PyMuPDF verifies complete, unfragmented export pages."""
import json
from pathlib import Path
import pymupdf

out = Path(__file__).resolve().parents[2] / 'contractdiff-v2.1-qa' / 'extended'
pdf = pymupdf.open(out / 'full-pdf-layout.pdf')
assert len(pdf) == 4, 'Expected summary plus three paired source sheets'
for number, page in enumerate(pdf):
    images = page.get_image_info()
    assert len(images) == (0 if number == 0 else 2)
    for item in images:
        rect = pymupdf.Rect(item['bbox'])
        assert rect in page.rect, 'A source page was clipped at a sheet boundary'
    page.get_pixmap(matrix=pymupdf.Matrix(.9, .9)).save(out / f'pdf-sheet-{number+1}.png')
docx = pymupdf.open(out / 'full-docx-layout.pdf')
text = '\n'.join(page.get_text() for page in docx)
for phrase in ['Professional Services Agreement', 'Breach of contract liability', '24,000', '30', '90']:
    assert phrase in text, phrase
for number, page in enumerate(docx):
    page.get_pixmap(matrix=pymupdf.Matrix(.9, .9)).save(out / f'docx-sheet-{number+1}.png')
result = {'passed': True, 'pdf_sheets': len(pdf), 'source_page_images': 6,
          'docx_sheets': len(docx), 'checks': ['All six PDF pages fit within three paired sheets',
          'DOCX printed text retains required changes and table amount']}
(out / 'print-verification.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
