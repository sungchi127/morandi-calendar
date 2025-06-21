# 🎨 Morandi Calendar | 莫蘭迪日曆

一個優雅的莫蘭迪色系日曆應用，具備完整的活動管理和社交功能。
![image](https://github.com/user-attachments/assets/d44f9e12-34f1-4e13-bdff-a2cb67c739df)
![image](https://github.com/user-attachments/assets/f5178168-31e3-4c99-8900-7c2c4a925939)

## ✨ 功能特點

### 📅 核心功能
- **多視圖日曆**：月視圖、週視圖、日視圖
- **活動管理**：創建、編輯、刪除活動
- **重複活動**：支持每日、每週、每月、每年重複
- **活動分類**：工作、個人、朋友、家庭、健康等
- **隱私設置**：私人、共享、公開、團體專屬四種模式
- **團體活動**：支持團體活動創建與管理
- **視覺標記**：團體活動具有特殊視覺標識

### 🎨 設計特色
- **莫蘭迪色系**：溫和優雅的配色方案
- **響應式設計**：完美適配各種設備
- **動畫效果**：流暢的 Framer Motion 動畫
- **現代 UI**：簡潔美觀的用戶界面

### 👥 團體功能
- **團體管理**：創建、加入、管理團體
- **邀請系統**：邀請碼快速加入團體
- **權限控制**：管理員、成員、觀察者等角色
- **團體活動**：專屬於團體成員的活動
- **成員管理**：邀請、移除、角色變更

### 💬 社交功能
- **留言系統**：為活動添加留言和討論
- **階層回覆**：支持留言回覆功能
- **互動按讚**：為留言點讚表達認同
- **圖片分享**：支持在留言中上傳圖片
- **通知系統**：即時推送邀請和活動通知

### 🔧 技術功能
- **用戶認證**：安全的 JWT 認證系統
- **實時同步**：React Query 數據同步
- **表單驗證**：React Hook Form + Yup 驗證
- **快速導航**：年月選擇器快速跳轉
- **搜尋功能**：智能搜尋活動、團體和用戶
- **多語言支持**：繁體中文界面

## 🚀 技術棧

### 前端
- **React 18** + **TypeScript**
- **Vite** - 快速構建工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **TanStack Query** - 強大的數據獲取和狀態管理
- **React Hook Form** - 高性能表單庫
- **Framer Motion** - 動畫庫
- **Lucide React** - 現代圖標庫

### 後端
- **Node.js** + **Express**
- **MongoDB Atlas** - 雲端數據庫
- **Mongoose** - MongoDB 對象建模
- **JWT** - JSON Web Token 認證
- **Joi** - 數據驗證庫
- **bcryptjs** - 密碼加密

## 📦 安裝與運行

### 環境要求
- Node.js 16+
- npm 或 yarn
- MongoDB Atlas 帳戶

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/sungchi127/morandi-calendar.git
cd morandi-calendar
```

2. **安裝後端依賴**
```bash
cd server
npm install
```

3. **設置環境變數**
```bash
cp .env.example .env
# 編輯 .env 文件，填入你的 MongoDB 連接字符串和其他配置
```

4. **啟動後端服務**
```bash
npm run dev
```

5. **安裝前端依賴**
```bash
cd ../client
npm install
```

6. **設置前端環境變數**
```bash
cp .env.example .env
# 根據需要調整 API URL
```

7. **啟動前端服務**
```bash
npm run dev
```

## 🎯 核心功能使用

### 團體功能
1. **創建團體**：在團體頁面點擊「創建團體」按鈕
2. **邀請成員**：生成邀請碼或直接邀請用戶
3. **管理權限**：設置成員角色（管理員、成員、觀察者）
4. **團體活動**：創建活動時選擇團體，活動將自動設為團體專屬

### 邀請系統
- **邀請碼加入**：輸入6-12位邀請碼快速加入團體
- **直接邀請**：通過用戶名或郵箱發送邀請
- **邀請管理**：查看、接受或拒絕收到的邀請

### 隱私控制
- **私人**：僅自己可見
- **共享**：與指定用戶共享
- **公開**：所有用戶可見
- **團體專屬**：僅團體成員可見

## 🎨 色彩主題

### 莫蘭迪色系
- **鼠尾草綠** (#9CAF9F)
- **玫瑰粉** (#D4A5A5)  
- **薰衣草紫** (#B8A8C8)
- **蜜桃橘** (#E8C4A0)
- **霧霾藍** (#A8B8C8)
- **奶油色** (#F0E6D6)
- **暖灰色** (#C8C0B8)

## 📝 API 文檔

### 認證端點
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/profile` - 獲取用戶資料

### 活動端點
- `GET /api/events` - 獲取活動列表
- `POST /api/events` - 創建新活動
- `PUT /api/events/:id` - 更新活動
- `DELETE /api/events/:id` - 刪除活動

### 團體端點
- `GET /api/groups` - 獲取用戶團體列表
- `POST /api/groups` - 創建新團體
- `PUT /api/groups/:id` - 更新團體資訊
- `DELETE /api/groups/:id` - 刪除團體
- `POST /api/groups/:id/join` - 加入團體
- `POST /api/groups/join-by-code` - 使用邀請碼加入團體
- `POST /api/groups/:id/leave` - 離開團體

### 邀請端點
- `GET /api/invitations` - 獲取邀請列表
- `POST /api/invitations` - 發送邀請
- `PUT /api/invitations/:id/accept` - 接受邀請
- `PUT /api/invitations/:id/decline` - 拒絕邀請

### 通知端點
- `GET /api/notifications` - 獲取通知列表
- `PUT /api/notifications/:id/read` - 標記為已讀
- `PUT /api/notifications/mark-all-read` - 全部標記為已讀
- `DELETE /api/notifications/:id` - 刪除通知

### 留言端點
- `GET /api/comments/event/:eventId` - 獲取活動留言
- `POST /api/comments/event/:eventId` - 創建留言
- `PUT /api/comments/:id` - 更新留言
- `DELETE /api/comments/:id` - 刪除留言
- `POST /api/comments/:id/like` - 留言按讚

## 🤝 貢獻

歡迎提交 Issues 和 Pull Requests！

### 開發規範
- 使用 TypeScript 進行類型安全開發
- 遵循 ESLint 和 Prettier 代碼規範
- 提交前請確保所有測試通過
- 提交信息請使用語意化格式

## 📝 更新記錄

### v2.0.0 - 團體功能更新
- ✨ 新增團體管理系統
- ✨ 新增邀請碼功能
- ✨ 新增團體活動支持
- ✨ 新增通知系統
- ✨ 新增多視圖日曆（週視圖、日視圖）
- 🐛 修復 TypeScript 編譯錯誤
- 🐛 修復伺服器連接問題

### v1.0.0 - 初始版本
- ✨ 基本日曆功能
- ✨ 活動管理
- ✨ 留言系統
- ✨ 用戶認證

## 📄 授權

MIT License

---

**Made with ❤️ by sungchi127**
