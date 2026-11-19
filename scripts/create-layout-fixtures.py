"""Maintainer-only formatting fixtures. No comparison-engine changes."""
from pathlib import Path
from io import BytesIO
from base64 import b64decode
import sys
if '--pdf-only' in sys.argv:
    import pymupdf
    out = Path(__file__).resolve().parents[1] / 'samples'
    for name in ['original', 'revised']:
        pdf = pymupdf.open(out / f'en-{name}.pdf')
        pdf[2].set_rotation(90)
        pdf.save(out / f'layout-{name}.pdf')
        pdf.close()
    print('Created mixed-orientation PDF fixtures.')
    raise SystemExit(0)
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.section import WD_ORIENT

out = Path(__file__).resolve().parents[1] / 'samples'
for revised in [False, True]:
    name = 'revised' if revised else 'original'
    doc = Document()
    section = doc.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width, section.page_height = Inches(11.7), Inches(8.3)
    section.left_margin = section.right_margin = Inches(.8)
    section.header.paragraphs[0].text = 'ContractDiff formatting fixture — local QA'
    section.footer.paragraphs[0].text = 'Fictional example • Confidential review'
    doc.add_heading('Professional Services Agreement', 0)
    doc.add_paragraph('This fictional agreement tests source formatting, not legal terms.')
    p = doc.add_paragraph('1. Payment terms. Customer shall pay within ')
    r = p.add_run('90' if revised else '30')
    r.bold = True
    r.font.color.rgb = RGBColor(20, 70, 120)
    p.add_run(' days of receiving an undisputed invoice.')
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    if not revised:
        doc.add_paragraph('2. Breach liability. A party in breach must compensate the other for documented direct losses.')
    doc.add_paragraph('3. Termination. Either party may give thirty days written notice.')
    table = doc.add_table(rows=3, cols=3)
    table.style = 'Light Shading Accent 1'
    for row, values in zip(table.rows, [('Milestone', 'Amount', 'Deadline'), ('Research', 'USD 12,000', '15 March 2026'), ('Final report', 'USD 24,000', '30 June 2026')]):
        for cell, value in zip(row.cells, values):
            cell.text = value
    doc.add_paragraph('中文格式检查：付款条款、责任条款及表格应保持可读。')
    # Tiny bundled fixture image verifies image loading without external dependencies.
    png = b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=')
    doc.add_picture(BytesIO(png), width=Inches(.25))
    doc.add_page_break()
    doc.add_heading('Schedule A — Review context', 1)
    doc.add_paragraph('This schedule remains unchanged. Both complete pages must remain available during review.')
    doc.save(out / f'layout-{name}.docx')
print('Created landscape DOCX fixtures. Use --pdf-only for PDF fixtures.')
