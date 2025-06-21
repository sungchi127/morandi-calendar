# 莫蘭迪日曆項目架構

## 項目概述
- **項目名稱**: 莫蘭迪日曆 (Morandi Calendar)
- **技術棧**: React + TypeScript (前端) + Node.js + Express (後端)
- **數據庫**: MongoDB Atlas
- **樣式**: Tailwind CSS + 莫蘭迪色彩主題

## 項目結構
```
calender/
├── client/          # React 前端應用
├── server/          # Node.js 後端 API
├── package.json     # 根目錄配置
└── README.md
```

## 主要功能模塊
1. **身份認證系統** - 用戶註冊/登入
2. **日曆系統** - 月/週/日視圖，活動 CRUD
3. **團體管理** - 創建/管理團體，成員權限
4. **通知系統** - 實時通知，設定管理
5. **邀請系統** - 團體邀請，邀請碼功能
6. **留言系統** - 活動留言，互動功能
7. **搜尋功能** - 活動搜尋，篩選功能

## API 路由
- `/api/auth` - 身份認證
- `/api/events` - 活動管理
- `/api/groups` - 團體管理
- `/api/comments` - 留言系統
- `/api/notifications` - 通知系統
- `/api/invitations` - 邀請系統