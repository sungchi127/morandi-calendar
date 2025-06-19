# 🎨 Morandi Calendar | 莫蘭迪日曆

一個優雅的莫蘭迪色系日曆應用，具備完整的活動管理和社交功能。

## ✨ 功能特點

### 📅 核心功能
- **日曆視圖**：直觀的月視圖界面
- **活動管理**：創建、編輯、刪除活動
- **重複活動**：支持每日、每週、每月、每年重複
- **活動分類**：工作、個人、朋友、家庭、健康等
- **隱私設置**：私人、共享、公開三種模式

### 🎨 設計特色
- **莫蘭迪色系**：溫和優雅的配色方案
- **響應式設計**：完美適配各種設備
- **動畫效果**：流暢的 Framer Motion 動畫
- **現代 UI**：簡潔美觀的用戶界面

### 💬 社交功能
- **留言系統**：為活動添加留言和討論
- **階層回覆**：支持留言回覆功能
- **互動按讚**：為留言點讚表達認同
- **圖片分享**：支持在留言中上傳圖片

### 🔧 技術功能
- **用戶認證**：安全的 JWT 認證系統
- **實時同步**：React Query 數據同步
- **表單驗證**：React Hook Form + Yup 驗證
- **快速導航**：年月選擇器快速跳轉

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

### 留言端點
- `GET /api/comments/event/:eventId` - 獲取活動留言
- `POST /api/comments/event/:eventId` - 創建留言
- `PUT /api/comments/:id` - 更新留言
- `DELETE /api/comments/:id` - 刪除留言
- `POST /api/comments/:id/like` - 留言按讚

## 🤝 貢獻

歡迎提交 Issues 和 Pull Requests！

## 📄 授權

MIT License

---

**Made with ❤️ by sungchi127**