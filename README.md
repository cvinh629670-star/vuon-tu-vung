# Vườn Từ Vựng

Ứng dụng Expo cho Android và iOS với bộ 3.000 từ tiếng Anh thông dụng đóng gói sẵn. Mỗi thẻ có phiên âm, từ loại và nghĩa tiếng Việt. Một số thẻ có câu ví dụ.

## Chạy trên điện thoại

Trên Android, đăng nhập GitHub và tải `vuon-tu-vung.apk` trong [Releases](https://github.com/cvinh629670-star/vuon-tu-vung/releases/latest). Mở tệp trên điện thoại để cài. APK có sẵn mã ứng dụng và bộ từ, nên có thể mở trực tiếp sau khi cài.

### Chạy bằng Expo Go

1. Cài Expo Go tương thích với Expo SDK 58.
2. Kết nối điện thoại và máy tính cùng một mạng Wi-Fi.
3. Chạy các lệnh sau trong thư mục dự án, rồi quét mã QR bằng Expo Go trên Android hoặc Camera trên iOS.

```powershell
npm.cmd ci
npm.cmd start
```

Chạy `npm.cmd run web` để xem bản trình duyệt và `npm.cmd test` để chạy kiểm tra.

## Lịch ôn SRS

- App đưa các thẻ đến hạn lên trước và đặt mục tiêu 10 từ mới mỗi ngày. Khi đạt mục tiêu, chọn **Học thêm từ mới** để học tiếp theo từng lượt tối đa 10 từ, đến khi hết bộ thẻ.
- Khi gặp từ mới, chọn **Quên**, **Khó**, **Nhớ** hoặc **Dễ** để ôn lại sau 10 phút, 1 ngày, 3 ngày hoặc 7 ngày tương ứng.
- Với từ đã học, khoảng ôn tăng theo mức độ nhớ. Chọn **Quên** đưa từ đó về lịch ôn sau 10 phút.
- Tiến độ và lịch ôn được lưu trên thiết bị. Bộ thẻ được tích hợp trong ứng dụng và chỉ đọc.

## Dữ liệu

Bộ thẻ chọn lọc và rút gọn dữ liệu [thichhoc-dict](https://github.com/thichhoc-org/thichhoc-dict/tree/4d6e92e8bcf8e3e762410c2b0a9f98fea8e62e5b), bổ sung các từ chức năng và ví dụ mở đầu. Dữ liệu được phát hành theo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Xem [ghi nguồn đầy đủ](data/ATTRIBUTION.txt).
