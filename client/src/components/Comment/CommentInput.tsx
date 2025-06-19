import React, { useState, useRef } from 'react';
import { Send, Image, X } from 'lucide-react';

interface CommentInputProps {
  onSubmit: (content: string, images?: File[]) => void;
  placeholder?: string;
  initialValue?: string;
  isReply?: boolean;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = '寫下你的留言...',
  initialValue = '',
  isReply = false,
  onCancel,
  isLoading = false,
}) => {
  const [content, setContent] = useState(initialValue);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0) return;
    
    onSubmit(content.trim(), selectedImages);
    setContent('');
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 限制最多3張圖片
    const newImages = [...selectedImages, ...files].slice(0, 3);
    setSelectedImages(newImages);

    // 創建預覽URL
    const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
    // 清理舊的URL
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls(newPreviewUrls);

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    
    // 清理被移除的URL
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  React.useEffect(() => {
    return () => {
      // 清理所有預覽URL
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className={`${isReply ? 'ml-11 mt-2' : ''}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 文字輸入區 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={isReply ? 2 : 3}
            className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-morandi-sage focus:border-transparent bg-surface text-text-primary placeholder-text-secondary"
            style={{ minHeight: isReply ? '60px' : '80px', maxHeight: '200px' }}
          />
        </div>

        {/* 圖片預覽 */}
        {imagePreviewUrls.length > 0 && (
          <div className="flex space-x-2">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`預覽 ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border border-border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center hover:bg-error-dark transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={selectedImages.length >= 3}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedImages.length >= 3}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="添加圖片 (最多3張)"
            >
              <Image className="w-4 h-4" />
            </button>
            {selectedImages.length >= 3 && (
              <span className="text-xs text-text-secondary">最多3張圖片</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isReply && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={(!content.trim() && selectedImages.length === 0) || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">{isLoading ? '發送中...' : (isReply ? '回覆' : '發送')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentInput;