# 🚀 莫蘭迪日曆 - 快速啟動指南

## 📋 當前狀態
- **進度**: 80% 完成
- **問題**: API 調用失敗，需要除錯
- **優先**: 修復前端與後端通信問題

## ⚡ 立即啟動

### 1. 啟動服務
```bash
cd /mnt/c/Users/哲頤/Desktop/calender

# 同時啟動前後端
npm run dev

# 或分別啟動 (如果上面不行)
npm run server  # 終端1: 後端
npm run client  # 終端2: 前端
```

### 2. 訪問地址
- **前端**: http://172.20.213.111:3000
- **後端**: http://172.20.213.111:5000
- **API 健康檢查**: http://172.20.213.111:5000/api/health

### 3. 測試帳戶
```
Email: test2@example.com
Password: 123456
```

## 🔍 緊急除錯

### 瀏覽器 Console 除錯
```javascript
// 開啟 F12 開發者工具，在 Console 執行:

// 檢查認證狀態
window.debugAPI.testAuth()

// 檢查活動 API
window.debugAPI.testEvents()

// 測試創建活動
window.debugAPI.testCreateEvent()
```

### 後端 API 測試
```bash
# 測試後端是否正常
curl http://172.20.213.111:5000/api/health

# 測試登入
curl -X POST http://172.20.213.111:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"123456"}'
```

## 📁 關鍵檔案
- **API 服務**: `client/src/services/api.ts`
- **認證上下文**: `client/src/contexts/AuthContext.tsx`
- **主日曆頁面**: `client/src/pages/CalendarPage.tsx`
- **後端應用**: `server/src/app.js`

## 🎯 待修復問題
1. 前端顯示「創建活動失敗」
2. 前端顯示「載入活動失敗」
3. 後端 API 正常，問題在前端調用

## 📋 完成後續工作
1. 修復 API 問題 ← **當前任務**
2. 實作留言功能
3. 多人共享日曆

---
📖 **詳細資訊請參考**: `PROJECT_STATUS.md`