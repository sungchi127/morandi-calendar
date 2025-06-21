# 開發環境設定

## 項目啟動方式
```bash
# 根目錄 - 同時啟動前後端
npm run dev

# 或分別啟動
npm run server  # 啟動後端
npm run client  # 啟動前端
```

## 開發端口
- **前端**: http://localhost:5173 (Vite 開發服務器)
- **後端**: http://localhost:5000 (Express API 服務器)
- **外部訪問**: http://172.20.213.111:5000 (用於跨設備測試)

## 環境變量
### 前端 (.env)
```
VITE_API_URL=http://172.20.213.111:5000/api
```

### 後端 (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
```

## 資料庫連接
- **MongoDB Atlas** - 雲端 MongoDB 服務
- 連接字符串已配置在後端環境變量中

## 測試用文件
- `test-api.js` - API 端點測試
- `test-recurrence.js` - 重複活動測試
- `server/test-*.js` - 各模組測試文件

## 常用開發指令
```bash
# 安裝依賴
npm run install-deps

# 構建前端
npm run build

# 檢查 API 健康狀態
curl http://localhost:5000/api/health
```