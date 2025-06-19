# 📋 莫蘭迪日曆專案開發狀態報告

**更新時間**: 2025-06-18 20:15 (Taiwan Time)  
**專案進度**: 80% 完成  
**狀態**: 功能已實現，存在 API 調用問題需修復

---

## 🎯 專案概述

建立一個類似 Google Calendar 的社交日曆應用，採用溫和的莫蘭迪色系設計。

### 核心需求
- 📅 月視圖日曆界面
- 🎨 莫蘭迪色系主題（7種療癒色彩）
- 👥 多人共享日曆功能
- 💬 活動留言板與照片分享
- 🔐 使用者認證系統
- 📱 響應式設計

---

## 🏗️ 技術架構

### 前端技術棧
- **React 18** + TypeScript
- **Tailwind CSS** - 客製化莫蘭迪色系
- **React Router v6** - 路由管理
- **React Query** - 服務端狀態管理
- **React Hook Form** + Yup - 表單處理與驗證
- **Framer Motion** - 動畫效果
- **Axios** - API 調用
- **Lucide React** - 圖標庫

### 後端技術棧
- **Node.js** + Express
- **MongoDB Atlas** - 雲端資料庫
- **Mongoose** - ODM
- **JWT** - 身份驗證
- **Joi** - 資料驗證
- **Bcrypt** - 密碼加密
- **Helmet** + CORS - 安全設定

### 開發環境
- **WSL2** Ubuntu 環境
- **前端地址**: http://172.20.213.111:3000
- **後端地址**: http://172.20.213.111:5000
- **資料庫**: MongoDB Atlas (連接正常)

---

## ✅ 已實現功能

### 1. 使用者認證系統 (100% 完成)
- ✅ 註冊功能 - 電子郵件、密碼、顯示名稱
- ✅ 登入功能 - JWT token 驗證
- ✅ 自動登入 - localStorage 持久化
- ✅ 登出功能
- ✅ 個人資料管理
- ✅ CORS 配置正確

### 2. 莫蘭迪色系設計 (100% 完成)
```javascript
// 7種主題色彩
{
  'morandi-sage': '#9CAF9F',      // 鼠尾草綠
  'morandi-rose': '#D4A5A5',      // 玫瑰粉
  'morandi-lavender': '#B8A8C8',  // 薰衣草紫
  'morandi-peach': '#E8C4A0',     // 蜜桃橘
  'morandi-blue': '#A8B8C8',      // 霧霾藍
  'morandi-cream': '#F0E6D6',     // 奶油色
  'morandi-grey': '#C8C0B8',      // 暖灰色
}
```

### 3. 日曆核心功能 (95% 完成)
- ✅ 月視圖日曆界面
- ✅ 日期導航 (前/後月)
- ✅ 今天按鈕
- ✅ 活動創建模態框
- ✅ 活動詳情檢視
- ✅ 活動編輯功能
- ✅ 活動刪除功能
- ✅ 莫蘭迪色彩標籤選擇
- ✅ 全天/時間活動支援
- ✅ 活動分類系統
- ✅ 隱私設定

### 4. 表單驗證與用戶體驗 (100% 完成)
- ✅ 完整的表單驗證 (Yup schema)
- ✅ 錯誤提示訊息中文化
- ✅ 載入狀態顯示
- ✅ 成功/錯誤 Toast 通知
- ✅ 動畫效果 (Framer Motion)

---

## 🗄️ 資料庫架構

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (加密),
  displayName: String,
  avatar: String (URL),
  preferences: {
    notifications: { email, browser, mobile },
    theme: String,
    defaultCalendarView: String,
    timezone: String
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  startDate: Date (required),
  endDate: Date (required),
  isAllDay: Boolean,
  color: String (莫蘭迪色彩),
  category: String (work|personal|friends|family|health|other),
  location: String,
  creator: ObjectId (ref: User),
  attendees: [{ user: ObjectId, status: String, addedAt: Date }],
  privacy: String (private|shared|public),
  sharedWith: [{ user: ObjectId, permissions: Object }],
  recurrence: { type, interval, endDate, occurrences },
  reminders: [String],
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Comments Collection (已設計，未實作)
```javascript
{
  _id: ObjectId,
  event: ObjectId (ref: Event),
  author: ObjectId (ref: User),
  content: String,
  images: [{ url, publicId, caption }],
  parentComment: ObjectId (ref: Comment),
  replies: [ObjectId],
  likes: [{ user: ObjectId, likedAt: Date }],
  isEdited: Boolean,
  editedAt: Date,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### CalendarShare Collection (已設計，未實作)
```javascript
{
  _id: ObjectId,
  owner: ObjectId (ref: User),
  sharedWith: ObjectId (ref: User),
  permissions: {
    canViewEvents: Boolean,
    canCreateEvents: Boolean,
    canEditEvents: Boolean,
    canDeleteEvents: Boolean,
    canComment: Boolean,
    canInviteOthers: Boolean
  },
  status: String (pending|accepted|declined),
  shareType: String (full_calendar|specific_events),
  categories: [String],
  note: String,
  expiresAt: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📁 專案結構

```
morandi-calendar/
├── package.json                 # 根目錄配置與啟動指令
├── README.md                   # 專案說明文件
├── PROJECT_STATUS.md           # 此狀態報告
├── server/                     # 後端 Node.js 應用
│   ├── src/
│   │   ├── app.js             # Express 主應用
│   │   ├── config/
│   │   │   └── database.js    # MongoDB 連接配置
│   │   ├── controllers/
│   │   │   ├── authController.js    # 認證控制器
│   │   │   └── eventController.js   # 活動控制器
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT 認證中介軟體
│   │   ├── models/
│   │   │   ├── User.js        # 使用者模型
│   │   │   ├── Event.js       # 活動模型
│   │   │   ├── Comment.js     # 留言模型
│   │   │   └── CalendarShare.js # 共享模型
│   │   └── routes/
│   │       ├── auth.js        # 認證路由
│   │       └── events.js      # 活動路由
│   ├── .env                   # 環境變數
│   └── package.json
└── client/                    # 前端 React 應用
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   ├── LoginForm.tsx
    │   │   │   └── RegisterForm.tsx
    │   │   ├── Calendar/
    │   │   │   └── MonthView.tsx
    │   │   └── Event/
    │   │       ├── EventModal.tsx       # 新增活動
    │   │       ├── EventDetailModal.tsx # 活動詳情
    │   │       └── EventEditModal.tsx   # 編輯活動
    │   ├── contexts/
    │   │   └── AuthContext.tsx # 認證上下文
    │   ├── pages/
    │   │   ├── AuthPage.tsx    # 登入/註冊頁面
    │   │   └── CalendarPage.tsx # 主日曆頁面
    │   ├── services/
    │   │   └── api.ts          # API 調用服務
    │   ├── types/
    │   │   └── index.ts        # TypeScript 類型定義
    │   ├── utils/
    │   │   ├── colors.ts       # 莫蘭迪色彩工具
    │   │   └── date.ts         # 日期處理工具
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css           # 全域樣式
    │   ├── debug.ts            # 除錯工具
    │   └── debug-api.ts        # API 除錯工具
    ├── .env                    # 前端環境變數
    ├── vite.config.ts
    ├── tailwind.config.js      # Tailwind 配置
    └── package.json
```

---

## ⚠️ 當前問題

### 🚨 緊急問題 - API 調用失敗
**症狀**:
- 前端顯示「創建活動失敗」
- 前端顯示「載入活動失敗」
- 使用者可以正常登入

**已驗證**:
- ✅ 後端 API 完全正常 (curl 測試通過)
- ✅ MongoDB Atlas 連接正常
- ✅ JWT token 生成正常
- ✅ CORS 設定正確

**可能原因**:
1. 前端 API 攔截器問題
2. Token 在 localStorage 中的存取問題
3. 前端請求格式問題
4. React Query 配置問題

**已添加調試工具**:
```javascript
// 在瀏覽器 Console 中可用
window.debugAPI.testAuth()        // 測試認證
window.debugAPI.testEvents()      // 測試獲取活動
window.debugAPI.testCreateEvent() // 測試創建活動
```

---

## 🔧 測試用帳戶

```javascript
// 已建立測試帳戶
{
  email: "test2@example.com",
  password: "123456",
  displayName: "測試用戶2"
}
```

---

## 🚀 啟動指令

### 開發環境啟動
```bash
# 從根目錄
cd /mnt/c/Users/哲頤/Desktop/calender

# 同時啟動前後端 (推薦)
npm run dev

# 或分別啟動
npm run server  # 後端: http://172.20.213.111:5000
npm run client  # 前端: http://172.20.213.111:3000
```

### 依賴安裝
```bash
# 安裝所有依賴
npm run install-deps

# 或分別安裝
cd server && npm install
cd ../client && npm install
```

### 環境變數配置
```bash
# 後端 .env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://sung891220:VsMB4FghpGirjXfW@calender.qzfma0x.mongodb.net/morandi-calendar?retryWrites=true&w=majority&appName=Calender
JWT_SECRET=morandi-calendar-super-secret-key-2024
CLIENT_URL=http://172.20.213.111:3000

# 前端 .env  
VITE_API_URL=http://172.20.213.111:5000/api
```

---

## 📋 下一步工作清單

### 🚨 緊急 (需立即修復)
1. **診斷 API 調用問題**
   - 檢查瀏覽器 Console 錯誤訊息
   - 驗證 localStorage token 有效性
   - 測試 React Query 配置
   - 修復前後端通信問題

### 📋 中優先級 (核心功能擴展)
2. **實作留言功能**
   - 活動留言板元件
   - 照片上傳功能 (Cloudinary)
   - 留言回覆系統
   - 點讚互動功能

3. **完善活動管理**
   - 拖拽移動活動
   - 活動重複設定
   - 提醒通知系統
   - 活動匯出功能

### 🔄 低優先級 (進階功能)
4. **多人共享日曆**
   - 邀請系統
   - 權限管理
   - 共享狀態顯示
   - 協作通知

5. **用戶體驗優化**
   - 週視圖與日視圖
   - 深色模式支援
   - 行動端 PWA
   - 搜尋與篩選功能

---

## 🔍 除錯步驟

### 1. 前端除錯
```bash
# 開啟瀏覽器到
http://172.20.213.111:3000

# 按 F12 開啟開發者工具
# 檢查 Console 標籤中的錯誤訊息

# 測試 API 連接
window.debugAPI.testAuth()
window.debugAPI.testEvents()
```

### 2. 後端除錯
```bash
# 測試後端健康狀態
curl http://172.20.213.111:5000/api/health

# 測試登入 API
curl -X POST http://172.20.213.111:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"123456"}'

# 使用返回的 token 測試活動 API
curl -X GET http://172.20.213.111:5000/api/events \
  -H "Authorization: Bearer [TOKEN]"
```

### 3. 常見問題解決
- **連接拒絕**: 檢查服務是否運行在正確端口
- **CORS 錯誤**: 確認後端 CORS 設定
- **認證失敗**: 檢查 JWT token 格式和有效期
- **資料庫錯誤**: 確認 MongoDB Atlas 連接字串

---

## 📞 聯絡資訊

**專案位置**: `/mnt/c/Users/哲頤/Desktop/calender/`  
**開發環境**: WSL2 Ubuntu  
**狀態**: 待修復 API 調用問題  

---

**💡 重要提醒**: 專案功能已基本完成，主要需要解決前端 API 調用問題。建議優先檢查瀏覽器 Console 的具體錯誤訊息，然後針對性修復。

**🎯 目標**: 修復後即可進入留言功能開發階段，完成完整的社交日曆應用。