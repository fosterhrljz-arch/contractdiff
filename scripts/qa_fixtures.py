"""Rasterize QA evidence and make image-only PDF fixtures, using PyMuPDF."""
import fitz,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT.parent/'contractdiff-qa';OUT.mkdir(exist_ok=True)
for name in ['en-original','en-revised','zh-original','zh-revised']:
 doc=fitz.open(ROOT/'samples'/f'{name}.pdf')
 for i,page in enumerate(doc):page.get_pixmap(matrix=fitz.Matrix(1.1,1.1)).save(OUT/f'{name}-{i+1}.png')
for variant,days in [('original',30),('revised',90)]:
 d=fitz.open();p=d.new_page();p.insert_text((50,60),'Services agreement',fontsize=20);p.insert_text((50,100),f'1. Payment terms. Customer must pay within {days} days.',fontsize=13)
 if variant=='original':p.insert_text((50,150),'2. Breach liability. Supplier shall pay for direct losses.',fontsize=13)
 p.insert_text((50,200),'3. Confidentiality. Both parties must protect records.',fontsize=13)
 pix=p.get_pixmap(matrix=fitz.Matrix(2,2));scan=fitz.open();sp=scan.new_page();sp.insert_image(sp.rect,stream=pix.tobytes('png'));scan.save(ROOT/'samples'/f'scanned-{variant}.pdf')
 p.get_pixmap().save(OUT/f'scanned-{variant}.png')
print('PDF render and scan fixtures ready')
