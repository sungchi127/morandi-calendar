import React, { useState } from 'react';
import { Link, Copy, Check, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteCodeInputProps {
  onJoinByCode: (code: string) => void;
  loading?: boolean;
  className?: string;
}

const InviteCodeInput: React.FC<InviteCodeInputProps> = ({
  onJoinByCode,
  loading = false,
  className = ''
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(true);

  const validateInviteCode = (code: string) => {
    // 簡單的邀請碼格式驗證（假設是6-12位字母數字組合）
    const codeRegex = /^[A-Za-z0-9]{6,12}$/;
    return codeRegex.test(code);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.trim().toUpperCase();
    setInviteCode(code);
    
    if (code.length > 0) {
      setIsValidFormat(validateInviteCode(code));
    } else {
      setIsValidFormat(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('請輸入邀請碼');
      return;
    }
    
    if (!isValidFormat) {
      toast.error('邀請碼格式不正確');
      return;
    }
    
    onJoinByCode(inviteCode.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const code = text.trim().toUpperCase();
      setInviteCode(code);
      setIsValidFormat(validateInviteCode(code));
      toast.success('已貼上邀請碼');
    } catch (err) {
      toast.error('無法讀取剪貼簿');
    }
  };

  return (
    <div className={`bg-surface border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-morandi-sage-light rounded-full flex items-center justify-center">
          <Link className="w-5 h-5 text-morandi-sage" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            使用邀請碼加入團體
          </h3>
          <p className="text-sm text-text-secondary">
            輸入團體管理員提供的邀請碼快速加入團體
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            邀請碼
          </label>
          <div className="relative">
            <input
              type="text"
              value={inviteCode}
              onChange={handleInputChange}
              placeholder="輸入 6-12 位邀請碼..."
              maxLength={12}
              className={`w-full px-4 py-3 pr-12 border rounded-lg bg-background text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 transition-colors ${
                !isValidFormat && inviteCode.length > 0
                  ? 'border-error focus:ring-error'
                  : 'border-border focus:ring-morandi-sage'
              }`}
              disabled={loading}
            />
            
            {/* 貼上按鈕 */}
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-colors"
              title="從剪貼簿貼上"
              disabled={loading}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          {/* 驗證提示 */}
          {!isValidFormat && inviteCode.length > 0 && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-error">
              <AlertCircle className="w-4 h-4" />
              <span>邀請碼應為 6-12 位字母或數字</span>
            </div>
          )}
          
          {isValidFormat && inviteCode.length > 0 && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-morandi-sage">
              <Check className="w-4 h-4" />
              <span>邀請碼格式正確</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={loading || !inviteCode.trim() || !isValidFormat}
            className="flex items-center space-x-2 px-6 py-3 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-4 h-4" />
            <span>{loading ? '加入中...' : '加入團體'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setInviteCode('');
              setIsValidFormat(true);
            }}
            className="px-4 py-3 text-text-secondary hover:text-text-primary transition-colors"
            disabled={loading}
          >
            清除
          </button>
        </div>
      </form>

      {/* 說明 */}
      <div className="mt-6 p-4 bg-morandi-sage-light/20 rounded-lg">
        <h4 className="text-sm font-medium text-text-primary mb-2">
          關於邀請碼
        </h4>
        <ul className="text-xs text-text-secondary space-y-1">
          <li>• 邀請碼由團體管理員生成和分享</li>
          <li>• 每個團體都有唯一的邀請碼</li>
          <li>• 使用邀請碼可以直接加入公開或邀請制團體</li>
          <li>• 邀請碼不區分大小寫，系統會自動轉換</li>
        </ul>
      </div>
    </div>
  );
};

export default InviteCodeInput;