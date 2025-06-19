// Debug: Check environment variables
console.log('🔍 Debug Info:');
console.log('VITE_API_URL:', (import.meta as any).env?.VITE_API_URL);
console.log('Current API Base URL:', (import.meta as any).env?.VITE_API_URL || 'http://172.20.213.111:5000/api');
console.log('Environment:', (import.meta as any).env?.NODE_ENV);

export {};