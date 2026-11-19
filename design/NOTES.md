# ContractDiff visual specification and verification

Concept: `concept.png`, generated with the built-in image-generation tool. Prompt brief: complete simple local contract comparison screen; white/slate background, navy Segoe UI chrome, teal actions, Georgia contract text, two upload slots, important-changes sidebar, aligned original/revised text, exact highlights, review buttons and source links. No decorative imagery, charts or marketing sections.

Tokens: white base, #18233f text, #f4f7fb sidebar, #eaf0f6 status band, #ced6e2 borders, #008d88 primary, #ffd5d5 removed, #d4f3db added. 5–6px radii. 30px brand, 21px sidebar title, 19px clause heading, 18px document text, 12–14px controls/metadata. The component families are upload fields, summary rows, change rows, review inputs and source dialog.

Viewed the concept and actual Playwright screenshots with view_image. Checked at 1440x1000 and 390x844: header/action alignment, upload fields, status band, sidebar/search/filter controls, two-column source alignment, document/UI typography, highlight colors and responsive stacking. No overlap or horizontal overflow observed. Removed an overlong clause-heading excerpt and retained concise clause titles.

Intentional differences from the illustrative concept: real sample wording is longer, so the second change extends below the first viewport; sample-format selector, topic filter, OCR switch and explicit local-save controls implement requested functionality. Source buttons are per version, since a deleted clause has no revised source. Accurate paragraph/page locators replace the invented sample page numbers. The UI uses real results and exact token marks; it does not reproduce fabricated paths or claims from the generated concept. Native OS window chrome is not part of the web app.

Browser plugin was not installed. Validation used Playwright against installed Chrome and Edge with networking disabled. The implementation follows the concept's layout, palette and typography; requested functional additions and actual document lengths account for the visible differences.
