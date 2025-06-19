const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const commentRoutes = require('./routes/comments');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: true, // 暫時允許所有來源，用於除錯
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分鐘
  max: 1000, // 增加到1000次請求
  message: {
    success: false,
    message: '請求次數過多，請稍後再試'
  }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/comments', commentRoutes);

// 在開發環境中提供一個簡單的前端頁面
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>莫蘭迪日曆</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #F0E6D6, #9CAF9F); min-height: 100vh; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #7A9D7D; margin-bottom: 20px; }
        .status { color: #9CAF9F; margin: 20px 0; }
        .info { background: #F9F7F5; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
        .success { color: #9CAF9F; font-weight: bold; }
        .note { color: #8A8A8A; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎨 莫蘭迪日曆</h1>
        <div class="status success">✅ 後端服務運行中</div>
        
        <div class="info">
          <h3>📡 API 端點測試</h3>
          <p><strong>健康檢查:</strong> <a href="/api/health" target="_blank">GET /api/health</a></p>
          <p><strong>用戶註冊:</strong> POST /api/auth/register</p>
          <p><strong>用戶登入:</strong> POST /api/auth/login</p>
          <p><strong>獲取行程:</strong> GET /api/events</p>
        </div>
        
        <div class="info">
          <h3>🎯 下一步</h3>
          <p>1. 後端 API 已正常運行</p>
          <p>2. MongoDB Atlas 連接成功</p>
          <p>3. 準備測試 API 端點</p>
        </div>
        
        <div class="note">
          前端 React 應用正在開發中<br>
          當前可通過 API 端點進行測試
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Morandi Calendar API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端點不存在'
  });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '資料驗證失敗',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '無效的資料格式'
    });
  }
  
  res.status(500).json({
    success: false,
    message: '服務器內部錯誤'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Morandi Calendar Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 External access: http://172.20.213.111:${PORT}/api/health`);
});