# API 端點說明

## 通知 API (`/api/notifications`)
- `GET /` - 獲取用戶通知列表（支援分頁、篩選）
- `GET /unread-count` - 獲取未讀通知數量
- `PUT /:id/read` - 標記通知為已讀
- `PUT /mark-all-read` - 批次標記為已讀
- `PUT /:id/archive` - 歸檔通知
- `PUT /batch-archive` - 批次歸檔
- `DELETE /:id` - 刪除通知
- `DELETE /batch-delete` - 批次刪除
- `GET /settings` - 獲取通知設定
- `PUT /settings` - 更新通知設定

## 邀請 API (`/api/invitations`)
- `GET /` - 獲取邀請列表（支援 type: sent/received）
- `GET /token/:token` - 通過 token 獲取邀請詳情
- `POST /:id/accept` - 接受邀請
- `POST /:id/decline` - 拒絕邀請
- `POST /token/:token/accept` - 通過 token 接受邀請
- `POST /join-by-code` - 通過邀請碼加入團體
- `DELETE /:id` - 取消邀請
- `POST /:id/resend` - 重新發送邀請
- `POST /groups/:groupId/generate-code` - 生成新邀請碼

## 團體 API (`/api/groups`)
- `GET /` - 獲取用戶團體列表
- `POST /` - 創建新團體
- `GET /search` - 搜尋公開團體
- `GET /:id` - 獲取團體詳情
- `PUT /:id` - 更新團體資訊
- `DELETE /:id` - 刪除團體
- `POST /:id/invite` - 邀請成員
- `POST /:id/leave` - 離開團體

## 活動 API (`/api/events`)
- `GET /` - 獲取活動列表
- `GET /search` - 搜尋活動
- `POST /` - 創建活動
- `GET /:id` - 獲取活動詳情
- `PUT /:id` - 更新活動
- `DELETE /:id` - 刪除活動