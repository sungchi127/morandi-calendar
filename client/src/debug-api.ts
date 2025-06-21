// Debug API calls
import { eventAPI, authAPI } from '@/services/api';

// 擴展 Window 接口
declare global {
  interface Window {
    debugAPI: {
      testAuth(): Promise<void>;
      testEvents(): Promise<void>;
      testCreateEvent(): Promise<void>;
    };
  }
}

window.debugAPI = {
  async testAuth() {
    try {
      const token = localStorage.getItem('token');
      console.log('Current token:', token);
      
      if (token) {
        const profile = await authAPI.getProfile();
        console.log('Profile response:', profile);
      } else {
        console.log('No token found');
      }
    } catch (error) {
      console.error('Auth test error:', error);
    }
  },
  
  async testEvents() {
    try {
      const events = await eventAPI.getEvents();
      console.log('Events response:', events);
    } catch (error) {
      console.error('Events test error:', error);
    }
  },
  
  async testCreateEvent() {
    try {
      const eventData = {
        title: "Debug 測試活動",
        description: "前端測試",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        isAllDay: false,
        color: "morandi-sage",
        category: "personal",
        location: "",
        privacy: "private",
        reminders: [],
      };
      
      const result = await eventAPI.createEvent(eventData as any);
      console.log('Create event result:', result);
    } catch (error) {
      console.error('Create event error:', error);
    }
  }
};

console.log('Debug API methods available:', {
  testAuth: 'window.debugAPI.testAuth()',
  testEvents: 'window.debugAPI.testEvents()',
  testCreateEvent: 'window.debugAPI.testCreateEvent()'
});

export {};