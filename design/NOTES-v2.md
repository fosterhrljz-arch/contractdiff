# Version 2 design and visual QA

Concept: `concept-v2.png`. A quiet three-panel document review workspace: compact white toolbar, subtle gray separators, a fixed change-navigation rail and full white source sheets on pale gray canvases. Primary blue is #007aff; text is near #1d1d1f; removed text uses muted red and inserted text muted green. Use system UI typography (Segoe UI on Windows), native document fonts, small line icons, generous spacing, rounded controls and restrained selection color. No decorative stock imagery.

Five reference points checked against the concept:

1. Left navigation has a clear count, search, filters and selected-change state.
2. The center and right panes display continuous complete documents with separate filenames.
3. The toolbar groups open/save/export, language, synchronization and zoom controls.
4. Selected paragraphs have a blue margin cue; changed characters retain independent red/green evidence.
5. Notes and reviewed status are immediately accessible below the change list.

Intentional differences: actual source PDFs have smaller, denser text than the illustrative concept. We preserve those page layouts rather than recreate sample paragraphs. DOCX uses its own source styles and tables. The absent side of a deletion displays an explicit annotation and surviving context, not a made-up clause. OCR/fallback warnings, sample choices, extraction notices, explicit local storage and export options implement required behavior. The app makes no fabricated confidence scores or legal claims. The generated concept's sample labels and page numbers are replaced by actual source locators.

Copy check: final controls are Open contracts, Save review, Export, Changes, Sync scroll and Fit; a compact EN/中文 switch changes interface copy. Risk badges mean review priority, with a persistent explanation. Full/concise/legacy reports have distinct labels. Placeholder marketing or concept-only controls are absent.

Visual QA: inspected concept, native PDF payment/deletion views, complete formatted DOCX/table view, Chinese UI, 390×844 change/document tabs, and printed report sheets. Desktop is tested at 1600×1000. No app-level horizontal overflow, clipped toolbar controls or overlapping panels were observed. Source panes scroll independently; page text is deliberately not reflowed in PDFs. Narrow screens show one document tab at a time. Browser plugin absent, so screenshots were produced through Playwright Chrome/Edge.

Representative final evidence included beside this file: workspace-pdf.png, workspace-deletion.png, workspace-docx.png, workspace-chinese.png, workspace-mobile.png and report-pdf-sheet.png. Earlier v1 concept/notes remain for historical comparison.
