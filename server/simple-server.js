const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>莫蘭迪日曆 - 測試頁面</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: linear-gradient(135deg, #F0E6D6, #9CAF9F); 
          min-height: 100vh; 
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          max-width: 600px; 
          background: white; 
          padding: 40px; 
          border-radius: 20px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
          text-align: center; 
        }
        h1 { color: #7A9D7D; margin-bottom: 20px; font-size: 2.5em; }
        .status { color: #9CAF9F; margin: 20px 0; font-size: 1.2em; font-weight: bold; }
        .info { 
          background: #F9F7F5; 
          padding: 20px; 
          border-radius: 10px; 
          margin: 20px 0; 
          text-align: left; 
        }
        .success { color: #9CAF9F; }
        .note { color: #8A8A8A; font-size: 14px; margin-top: 20px; }
        .emoji { font-size: 2em; margin: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🎨</div>
        <h1>莫蘭迪日曆</h1>
        <div class="status success">✅ 伺服器連接成功！</div>
        
        <div class="info">
          <h3>🎉 恭喜！</h3>
          <p>✅ Node.js 伺服器正常運行</p>
          <p>✅ Express 框架載入成功</p>
          <p>✅ 網路連接正常</p>
          <p>✅ 可以開始開發莫蘭迪日曆</p>
        </div>
        
        <div class="info">
          <h3>📋 下一步計劃</h3>
          <p>1. ✅ 建立基礎伺服器（已完成）</p>
          <p>2. 🔄 連接 MongoDB 資料庫</p>
          <p>3. 🔄 建立用戶認證系統</p>
          <p>4. 🔄 開發日曆功能</p>
          <p>5. 🔄 實作莫蘭迪主題設計</p>
        </div>
        
        <div class="note">
          伺服器端口: <strong>5000</strong><br>
          訪問時間: <strong>${new Date().toLocaleString('zh-TW')}</strong>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API 測試成功', 
    timestamp: new Date().toISOString(),
    server: 'Express.js',
    status: 'running'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log('🚀 簡易測試伺服器啟動成功!');
  console.log(`📱 請在瀏覽器開啟: http://localhost:${PORT}`);
  console.log(`🧪 API 測試端點: http://localhost:${PORT}/test`);
});