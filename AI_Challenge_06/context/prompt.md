"Từ bây giờ, tôi muốn bạn đóng vai trò là Technical Architect kiêm Technical Writer cho dự án này. Hãy tạo một file tên là `CONTEXT.md` ở thư mục gốc của dự án.
File này sẽ là 'bộ nhớ dài hạn' để bạn và các AI khác đọc vào là hiểu ngay cấu trúc dự án.

Mỗi khi hoàn thành một bước (Thiết kế data, viết core logic, viết unit test), bạn **bắt buộc phải cập nhật file `CONTEXT.md`** này với các nội dung chính:

1. **Project Overview:** Mục tiêu và bài toán cần giải.
2. **Architecture & Data Flow:** Các luồng xử lý chính (Ví dụ: Input -> Sort -> Filter -> Engine -> Output).
3. **File Structure:** Sơ đồ cây thư mục và chức năng từng file.
4. **Business Rules:** Tóm tắt các luật bảo hiểm đã cài đặt (Copay, Deductible, Waiting Period...).
5. **Current Progress & Next Steps:** Những gì đã làm xong và những gì cần làm tiếp theo.

Hãy khởi tạo file `CONTEXT.md` phiên bản 1.0 ngay bây giờ dựa trên những gì chúng ta vừa thảo luận về dự án TypeScript Policy Benefits Calculator."

Giai đoạn 1: Định nghĩa cấu trúc dữ liệu (Data Modeling)
Prompt 1:

"Tôi đang làm một bài toán 'Policy Benefits Calculator' bằng TypeScript. Bước đầu tiên, hãy giúp tôi định nghĩa các TypeScript interface cho các đối tượng sau:

Policy: chứa annual limit, per-visit sub-limits (cho từng loại bệnh/benefit_type), copay (phần trăm hoặc cố định), deductible, và waiting periods.

Expense: chứa expense_id, date (string YYYY-MM-DD), benefit_type, sub_benefit, amount, diagnosis, provider.

CalculationResult: cấu trúc đầu ra cho từng expense giống như mẫu: expense_id, submitted_amount, covered_amount, copay_amount, member_pays, decision ('COVERED' | 'PARTIALLY_COVERED' | 'DENIED'), reason, remaining_annual_limit, remaining_visit_limit.

FinalSummary: chứa số dư còn lại của gói bảo hiểm sau khi xử lý xong toàn bộ.

Hãy viết code các interface này vào file types.ts."

Prompt 2:

"Dựa vào types.ts, hãy tạo cho tôi:

File policy.json với các thông số thực tế (Ví dụ: Annual Limit: 100,000 THB, Outpatient Sub-limit: 3,000 THB/visit, Copay: 20%, Deductible: 2,000 THB, Waiting period: 30 ngày kể từ ngày hiệu lực 2024-01-01).

File expenses.json gồm đúng 20 hóa đơn của cùng một thành viên. Hãy thiết kế ngày tháng (date) tăng dần từ tháng 01/2024 đến tháng 06/2024 và cố ý sắp xếp để kích hoạt đủ 6 kịch bản:

Case 1: Được chi trả hoàn toàn (sau khi đã vượt qua mức Deductible).

Case 2: Áp dụng mức Deductible ở các hóa đơn đầu tiên (Thành viên phải tự trả).

Case 3: Áp dụng Copay 20%.

Case 4: Bị từ chối (DENIED) vì nằm trong thời gian chờ (khám trước ngày 2024-01-31).

Case 5: Bị giảm số tiền nhận được vì chạm trần Sub-limit của lần khám đó.

Case 6: Bị từ chối hoặc chỉ trả một phần nhỏ ở các hóa đơn cuối cùng vì cạn kiệt hạn mức năm (Limit Exhausted)."

Giai đoạn 2: Xây dựng Core Logic Engine

Prompt Mẫu 3:

"Bây giờ chúng ta sẽ viết class BenefitsCalculator trong file calculator.ts. Class này có một hàm chính là processExpenses(policy: Policy, expenses: Expense[]): { results: CalculationResult[], summary: FinalSummary }.

Hãy suy nghĩ từng bước (Chain-of-thought) và cài đặt logic tuân theo các quy tắc sau:

Chronological Order: Phải clone mảng expenses và sắp xếp theo ngày (date) tăng dần trước khi xử lý.

State Tracking: Phải có biến cục bộ để theo dõi: current_remaining_annual_limit và accumulated_deductible_paid (số tiền deductible thành viên đã tích lũy trả từ đầu năm).

Pipeline xử lý cho từng Expense:

B1: Kiểm tra Waiting Period. Nếu ngày khám nằm trong thời gian chờ -> DENIED.

B2: Áp dụng Deductible. Nếu thành viên chưa trả đủ hạn mức deductible (ví dụ 2,000 THB), số tiền hóa đơn này phải trừ vào deductible trước, bảo hiểm chưa trả phần này.

B3: Áp dụng Per-visit Sub-limit. Lấy số tiền sau deductible so sánh với Sub-limit, giới hạn lại nếu vượt quá.

B4: Áp dụng Copay %. Tính số tiền bảo hiểm trả (ví dụ 80%) và thành viên trả (20%).

B5: Kiểm tra Annual Limit còn lại. Nếu số tiền bảo hiểm định trả lớn hơn current_remaining_annual_limit, thì giảm số tiền trả xuống bằng đúng số dư còn lại.

B6: Cập nhật lại State (trừ bớt annual limit) và tạo đối tượng CalculationResult với câu reason giải thích chi tiết, tường minh cho người dùng dễ hiểu lý do tại sao được nhận số tiền đó.

Hãy viết code TypeScript tường minh, sạch sẽ và giải thích ngắn gọn thuật toán của bạn."

Giai đoạn 3: Viết Unit Test và Hoàn thiện

Prompt Mẫu 4:

"Tôi muốn viết Unit Test cho class BenefitsCalculator bằng Jest. Hãy tạo file calculator.spec.ts (hoặc .test.ts) và viết ít nhất 10 test cases độc lập để kiểm thử các hàm cô lập hoặc kịch bản cụ thể:

Test hóa đơn bình thường được cover 100%.

Test hóa đơn bị từ chối do nằm trong Waiting Period.

Test khấu trừ Deductible chính xác qua 2 hóa đơn đầu tiên.

Test áp dụng Copay 20%.

Test hóa đơn vượt quá giới hạn Per-visit Sub-limit.

Test hóa đơn làm cạn kiệt hoàn toàn Annual Limit.

Test hóa đơn nộp vào sau khi Annual Limit đã bằng 0.

Test việc sắp xếp ngày tháng (nếu mảng đầu vào bị lộn xộn ngày, hệ thống vẫn phải sort đúng rồi mới tính).
...
Hãy mock dữ liệu nhỏ gọn cho từng test case để đảm bảo test chạy độc lập và không bị phụ thuộc vào file JSON lớn."
