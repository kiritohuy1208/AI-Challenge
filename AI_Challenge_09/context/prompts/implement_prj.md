Phase 0: Khởi tạo Project & Sinh Dữ Liệu (Scaffold & Dataset)
Mục tiêu: Xây dựng móng nhà, cài đặt thư viện và tự động hóa việc tạo 5.000 dòng dữ liệu giả với độ phân phối logic.

Prompt Phase 0:
"Please review @CONTEXT.md. I want to execute Phase 0 — Scaffold & dataset.

Act as a Senior Frontend Engineer. Assume I have already run npm create vite@latest . -- --template react-ts and installed Tailwind CSS.

Provide the npm install command for these specific dependencies: recharts, papaparse, @types/papaparse, @tanstack/react-table, date-fns, and lucide-react.

Create the Node.js script scripts/generate-claims.ts. Strictly follow the dataset generation rules in Section 6.2 of the context. Ensure exact column names, realistic skewed distributions, the ~15% rejection rate, and exactly 5,000 rows. Use native Node.js fs or csv-writer (provide install command if needed).

Add a script to package.json to run this generator (e.g., "generate-data": "npx tsx scripts/generate-claims.ts").

Self-Review (Strict Tech Lead):
Before outputting the code, create a markdown checklist of the rules in Section 6.2. Verify your script logic handles the approved_amount = 0 for REJECTED and processing time nullification for PENDING. Output the corrected code and the checklist."

Phase 1: Giao diện Lõi, State & KPIs (Core Dashboard)
Mục tiêu: Xử lý luồng dữ liệu một chiều (Single Source of Truth), nạp CSV và tính toán 5 chỉ số KPI trên cùng.

Prompt Phase 1:
"Moving to Phase 1 — Core dashboard based on @CONTEXT.md.

Create src/types/claim.ts containing the Claim, enums, and FilterState interfaces based on Section 3.

Create a custom hook src/hooks/useClaimsData.ts using PapaParse to fetch data/claims.csv from the public folder on mount. Handle loading state and data type coercion (string to Date/Number).

Implement src/context/FilterContext.tsx to hold the global filter state.

Create src/hooks/useFilteredClaims.ts to apply the active filters (Date range, types, insurers, countries, statuses, and drillDownDiagnosis) to the raw claims. Wrap the return value in useMemo.

Build the KpiCards component to calculate and display the 5 metrics specified in Section 6.3.

Critical: Format large currency amounts properly (e.g., Intl.NumberFormat) and ensure PENDING claims are excluded from the approval rate and processing time calculations.

Self-Review (Strict Tech Lead):
Create a checklist from Section 6.3 and 6.5. Cross-check your KPI math. Have you excluded PENDING where required? Are you using memoization? Fix any issues before outputting the code."

Phase 2: Hệ thống Biểu đồ (Charts)
Mục tiêu: Tích hợp Recharts, render 6 biểu đồ, hiển thị Tooltip và quan trọng nhất là tính năng "Drill-down".

Prompt Phase 2:
"Let's implement Phase 2 — Charts using Recharts, referencing @CONTEXT.md.

Build the DashboardCharts component which receives data from useFilteredClaims. Create the 6 charts specified in Section 6.6 within a responsive Tailwind grid.

Focus areas:

Time Grouping: The 'Claims over time' line chart must support toggling between 'week' and 'month' groupings.

Drill-down Logic: For the 'Top 10 diagnoses by frequency' bar chart, attach an onClick event to the bars. When clicked, it must update drillDownDiagnosis in the FilterContext.

Tooltips & UI: Ensure all charts have readable axis labels, legends, and exact-value <Tooltip /> components.

Self-Review (Strict Tech Lead):
Create a checklist of the 6 charts from Section 6.6. Verify the aggregation logic for each chart (e.g., histogram buckets for processing time). Did you implement the onClick handler for the diagnosis drill-down? Fix immediately if missed, then output."

Phase 3: Bảng dữ liệu & Xuất File (Table & Export)
Mục tiêu: Xử lý Data Table hiển thị 5.000 dòng mượt mà với tính năng phân trang, sắp xếp và tải CSV.

Prompt Phase 3:
"Now for Phase 3 — Table & export.

Build the ClaimsTable component using @tanstack/react-table v8. It should display the current filteredClaims.

Implement client-side sorting (clickable headers) and pagination (25 rows per page).

Add a visual indicator above the table if drillDownDiagnosis is active, including a 'Clear Drill-down' button.

Implement an 'Export to CSV' button that uses Papa.unparse to download the currently filtered data (not the raw data).

Style the table cleanly using Tailwind CSS, ensuring it's responsive.

Self-Review (Strict Tech Lead):
Check against Section 6.4. Does pagination reset when filters change? Does the export button only download the currently visible/filtered dataset? Verify the table API implementation. Provide the final code."

Phase 4: Hoàn thiện & Layout (Polish & Deploy)
Mục tiêu: Lắp ráp tất cả component lại, tối ưu responsive và thêm trạng thái Loading.

Prompt Phase 4:
"Finally, let's complete Phase 4 — Polish & deploy.

Assemble everything in src/App.tsx and DashboardLayout.tsx.

Ensure a strict CSS Grid/Flexbox layout: KPI cards on top, Global Filters below them, a 2-column grid for charts (1 column on tablet/mobile), and the Table at the bottom.

Implement a clean Loading Skeleton or Spinner that displays while isLoading from useClaimsData is true. Do not render the dashboard until data is ready.

Ensure tab-index accessibility for filter inputs.

Double-check that there are no horizontal scrollbars on the main window.

Self-Review (Strict Tech Lead):
Review Section 6.7. Is the layout fully responsive? Is the loading state correctly blocking the UI to prevent undefined errors? Output the final layout and assembly code."
