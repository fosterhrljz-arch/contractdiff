# ContractDiff 2.1 design and visual verification

The built-in image generation tool produced `concept-v2.1.png` before implementation. The direction extends the existing workspace: white compact chrome, cool gray document canvases, quiet borders, blue primary action, code-native SVG icons and controls, and unchanged source typography. No generated artwork is used as app UI.

Design tokens: #007aff primary, #202127 text, #626773 secondary text, #e0e2e7 separators, #eff1f5 canvas, white paper. Controls use system UI at 12–14px; the wordmark is 21px, sidebar heading 18px and change titles 13–14px. Source fonts are preserved. Dividers are 8px with a visible grip and keyboard focus state. Native PDF pages render at 2× density where memory permits. The primary header action is Export; Save review remains explicit.

## Fidelity ledger

| Point | Concept and final evidence | Decision |
| --- | --- | --- |
| Layout | Three columns, quiet header, visible central divider | Implemented, with an additional functional sidebar divider |
| Toolbar | Sidebar, Open contracts, Save review, Export, language; second row sync/zoom/Fit/reading | Implemented with accessible names and stateful controls |
| Selection | Pale blue change row; red 30 / green 90 inside full documents | Exact source glyph geometry, verified after zoom/resize |
| Typography | Strong app identity, legible controls, serif source documents | Original PDF/DOCX fonts retained; real samples are denser than the illustrative concept |
| Palette and spacing | White/cool gray surfaces, blue action, restrained borders | Implemented without added marketing or decorative elements |
| Reading mode | Requested minimal chrome and full source focus | Global header/sidebar/status hidden; change arrows, sync, zoom and exit remain |
| Export | Clear report choices and simple actions | Concise report default; full comparison and legacy format preserved |
| Responsive behavior | Same visual language on narrower screens | 1000px laptop plus 390px mobile tabs tested; dividers only on desktop |

Copy audit: final visible controls match the requested workflow. Differences from the illustrative image are deliberate: actual document filenames/locators replace invented page labels; source text is never rewritten to imitate concept text; existing exact-evidence/review widgets remain; Fit defaults to 100% rather than the concept's illustrative 115%. Actual source page counts are three per English PDF, not the concept's fictional single page. The generated version suffix is recorded in package metadata rather than added as another toolbar label. Source context is automatically positioned at the selected change instead of always showing the document title.

The concept and final screenshots were inspected using view_image. Five visual areas received direct comparison: toolbar, sidebar, source pages, highlights/dividers, and typography/spacing. Reading mode, Chinese/English UI, export dialog, landscape DOCX, high zoom and mobile screenshots were also inspected. A high-zoom visibility defect found in screenshots was corrected and retested. There is no remaining material UI mismatch beyond the intentional source-content differences above.

Browser plugin not available; Playwright used installed offline Chrome/Edge. Screenshots use 1600×1000, 1000×800 and 390×844; the generated concept's 1568×1004 output is closely matched by the desktop viewport. Controls and source rendering were verified rather than compared as a static mockup. The concept was faithfully implemented within the documented requirements to retain real source layout and existing functionality.

## Concept prompt

Create a crisp complete desktop UI design concept for ContractDiff version 2.1, a local private contract document review workspace, 1600x1000 layout. Apple inspired clean restrained professional utility, white toolbar, very light cool gray document canvas, near-black typography, blue #007aff actions, subtle hairline borders, 8px control radius. Entire screen with two compact toolbar rows. Top: small document logo and ContractDiff, icon Sidebar, Open contracts, Save review, blue Export, EN / 中文. Second toolbar: Professional Services Agreement, 2 changes, Sync scroll toggle on, minus, editable 115% field, plus, Fit, Reading mode button. Left 280px sidebar Changes, search, All changes / All topics filters, two changes: Payment terms changed High 30 → 90 Page 1 block 6 selected blue pale; Liability text removed High clause 9. Below a compact review note field and Mark reviewed. Center and right full ORIGINAL and REVISED paper documents, native serif text with continuous paragraphs, small precise red 30 and green 90 highlights in clause4, deletion of breach liability clause9 fully red only on original. Both panels resizable with a narrow visible drag grip between; sidebar resizable and collapsible. Lots of source context visible, clean full paper margins. PDF pages must look like actual documents, not change cards. Minimal unobtrusive bottom local processing message. Code native UI text icons controls; no photos no gradients no decorative art. Every main requested surface included. Typography UI 13-14px, 20px brand, legible document type. Generate only this main workspace concept; reading mode will hide sidebar and top global header while retaining slim zoom and exit controls. Do not add metrics confidence scores legal judgments invented features or unrelated navigation.
