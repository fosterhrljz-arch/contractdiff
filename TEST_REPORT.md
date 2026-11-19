# ContractDiff 2.1 verification

## Verified outcome

Version 2.1 refines layout controls, reading mode, source rendering and navigation. The v2 extractor is unchanged in this update. `src/core.js` is byte-for-byte unchanged from v1 (SHA-256 `6ad8f1f8ab49d408757bf73e04202c96753824296f9a46eba761b07d9f502ebf`). The extractor only adds presentation coordinates: native PDF text-item indexes and OCR word boxes. All eight original sample pairs retain identical extracted text, blocks, source locators and comparison counts.

| Check | Result |
| --- | --- |
| Unit/regression tests | 34 passed: original 21, 8 navigation/integrity and 5 layout/scroll/zoom regressions |
| Chrome suites | 21 preserved-flow checks + 15 new workspace checks passed, direct local-file launch |
| Edge suites | 21 preserved-flow checks + 15 new workspace checks passed, direct local-file launch |
| Extended suite | Local scan OCR, mixed-format upload, corrupt input, standalone PDF-source report and DOCX report passed |
| Required change | Exactly 2 changes for English and Chinese PDF/DOCX: 30 → 90 days and whole breach-liability deletion |
| Precise native PDF navigation | Both payment overlays align with actual text-layer glyph rectangles; observed position difference below 0.02 px in the sample at tested zoom; assertion tolerance 2 px |
| Deleted liability | Full original clause highlighted; revised side selects next surviving context with an explicit absence annotation and no fabricated counterpart highlight |
| Full source context | Six complete PDF pages; all 28 original / 27 revised DOCX blocks and both tables, no mapping fallback in the primary samples |
| Reordered clauses / amounts / deleted paragraphs / unchanged | Existing regression results retained; exact table-row amount navigation and surviving-context navigation pass |
| Resize / sidebar | Mouse drag, keyboard adjustment, double-click reset, collapse/restore and persisted split checked |
| Reading mode | Hides chrome; preserves change navigation, notes and zoom; Escape returns to workspace |
| Scroll and zoom | Continuous bidirectional block/gap interpolation, independent scroll, 50–300% custom zoom, invalid input handling, zoom-to-fit and reading-context retention checked |
| High-zoom reveal | Selecting a change brings the exact word into view horizontally as well as vertically in PDF and DOCX |
| Layout fixtures | Landscape DOCX with styled runs, tables, embedded image, header/footer and page break; mixed-orientation PDF with preserved aspect ratio |
| Review storage | Notes and reviewed state save/reload with original files; original download matches source bytes |
| Search and filters | Keyword/topic/unreviewed filters work without removing document pages |
| Reports | Full page images/formatted DOCX, concise 2-change report, internal source links, review notes and real PDF output checked |
| Full PDF print pagination | Summary plus 3 paired source sheets; all six source-page images fit entirely within their sheets |
| Interface | English/Chinese switching; 1600×1000 desktop, 1000×800 laptop and 390×844 mobile reading/review tabs without horizontal page overflow |
| Offline/privacy/runtime | Offline browser contexts; zero HTTP(S) requests, zero console errors and zero unhandled page errors in successful suites |

Browsers: Chrome 156.0.8078.80 and Edge 157.0.4341.42 on Windows. Each suite uses a fresh automation profile. The browser plugin was unavailable; Playwright controlled installed browsers. No user account or existing browser session was used.

## Export and visual verification

The full PDF export embeds the rendered original pages and percentage-positioned overlays in standalone HTML. Printing uses a summary followed by paired page sheets. A pagination defect discovered during review was fixed: source images now fit within a sheet rather than fragmenting across blank sheets. PyMuPDF checks page count and every embedded image rectangle, and renders every output sheet for inspection. DOCX retains formatted text/table content and uses browser pagination; table rows are kept together where possible.

The v2.1 concept and final desktop, deletion, DOCX, Chinese, mobile and print screenshots were inspected. Document text follows the source's typography, even where denser than the illustrative concept. The sidebar, toolbar, drag dividers, source sheets, blue selection bars, red/green exact highlights, note inspector, simplified export dialog, reading mode and narrow-screen tabs were checked for clipping and overlap. See `design/NOTES-v2.1.md`.

`test-results/` includes successful preserved-flow and layout-suite browser JSON, extended JSON, print verification and unit TAP output. `design/` includes representative final screenshots. All sample files and test source are included.

## Defects found and corrected in this update

- Restoring a resized source view could finish before final native PDF geometry was ready. Navigation now waits through rendering and retains the selected source until actual user scrolling.
- Divider drag initially included half the divider width in the new position. It now uses the exact pointer displacement from the drag origin.
- Scrolling through a deleted block could advance inside its surviving counterpart and then move back. The absent block now holds the nearest surviving context until matched content resumes.
- At large zoom, a correctly highlighted word could be outside the horizontal viewport. Selecting a change now reveals the exact word in both axes.
- Browser scroll clamping during zoom-to-fit could be mistaken for user scrolling. Layout-generated events are briefly ignored; wheel, touch, pointer and keyboard interaction immediately restore user control. Automated checks cover 300% → Fit → reading mode.

## Verification limits

Automated download tests require execution outside this host's filesystem sandbox; they run in isolated offline profiles writing only QA artifacts. The app itself needs no administrator rights or elevated permissions.

Browser tests observe the PDF export popup and the request to print, then use Chromium's print engine to create a real PDF. They intercept the native print dialog to avoid headless Edge's concurrent-print race. A human choosing Save as PDF in the OS dialog was not automated.

DOCX is checked through the actual bundled renderer, paragraph/table mapping and printed content. Microsoft Word/LibreOffice page output is not available for an independent pagination comparison; the UI and README explicitly disclose that DOCX pagination can differ. Fonts, advanced Word objects and complex formatting are not certified.

Native simplified-Chinese PDF/DOCX and clean English scanned PDFs are tested. Low-quality/traditional-Chinese scans, unusual PDF reading orders, merged/nested tables, encrypted documents and non-Chromium browsers are not certified. OCR boxes are labeled approximate. Extracted text, matching and keyword-based priorities require human verification; no general accuracy percentage or legal conclusion is claimed.
