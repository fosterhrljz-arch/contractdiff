# Third-party software

ContractDiff bundles the runtime code and data needed for offline use. Exact installed versions are recorded in `dist/dependency-versions.json`. The original license texts are preserved in `licenses/` and in the generated JavaScript legal notices.

- React and React DOM — MIT, https://github.com/facebook/react
- PDF.js — Apache-2.0, https://github.com/mozilla/pdf.js. Bundled worker, CMaps, standard fonts and WASM have their upstream license notices preserved. API reference: https://mozilla.github.io/pdf.js/examples/
- Tesseract.js — Apache-2.0, https://github.com/naptha/tesseract.js
- Tesseract.js core — Apache-2.0 and included upstream notices, https://github.com/naptha/tesseract.js-core
- English model from tessdata_fast and simplified-Chinese model from tessdata_best — Apache-2.0, https://github.com/tesseract-ocr/tessdata_fast and https://github.com/tesseract-ocr/tessdata_best. Local worker configuration reference: https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
- docx-preview — MIT, https://github.com/VolodymyrBaydalka/docxjs; includes JSZip (MIT or GPL-3.0, used under MIT), pako (MIT/Zlib), and their bundled dependency notices. Version 0.3.7 renders local DOCX documents.
- fflate — MIT, https://github.com/101arrowz/fflate
- esbuild (build tool) — MIT, https://github.com/evanw/esbuild
- Playwright (test tool) — Apache-2.0, https://github.com/microsoft/playwright

Transitive dependency notices are also included. Some development-environment notices concern build/test dependencies that are not executed in the app. No runtime component is fetched from these links. Sample contracts are fictional test fixtures, not legal templates or advice. Document-generation/rasterization scripts refer to python-docx, ReportLab and PyMuPDF as optional maintainer tools; their runtimes are not part of the delivered browser app.
