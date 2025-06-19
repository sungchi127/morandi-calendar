import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const registerSchema = yup.object({
  email: yup
    .string()
    .email('請輸入有效的電子郵件地址')
    .required('電子郵件是必填項目'),
  password: yup
    .string()
    .min(6, '密碼至少需要6個字符')
    .required('密碼是必填項目'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], '兩次輸入的密碼不一致')
    .required('請確認密碼'),
  displayName: yup
    .string()
    .min(2, '顯示名稱至少需要2個字符')
    .max(50, '顯示名稱不能超過50個字符')
    .required('顯示名稱是必填項目'),
});

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.displayName);
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-surface rounded-xl shadow-soft p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-text-primary mb-2">
            建立帳戶
          </h1>
          <p className="text-text-secondary">
            加入莫蘭迪日曆，開始美好的時光管理
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
              顯示名稱
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-text-muted" />
              </div>
              <input
                {...register('displayName')}
                type="text"
                id="displayName"
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-lg
                  focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage
                  transition-colors placeholder:text-text-muted
                  ${errors.displayName 
                    ? 'border-error bg-error/5' 
                    : 'border-border bg-background'
                  }
                `}
                placeholder="您的顯示名稱"
                disabled={isLoading}
              />
            </div>
            {errors.displayName && (
              <p className="mt-2 text-sm text-error">{errors.displayName.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              電子郵件
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-muted" />
              </div>
              <input
                {...register('email')}
                type="email"
                id="email"
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-lg
                  focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage
                  transition-colors placeholder:text-text-muted
                  ${errors.email 
                    ? 'border-error bg-error/5' 
                    : 'border-border bg-background'
                  }
                `}
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-error">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              密碼
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted" />
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`
                  w-full pl-10 pr-12 py-3 border rounded-lg
                  focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage
                  transition-colors placeholder:text-text-muted
                  ${errors.password 
                    ? 'border-error bg-error/5' 
                    : 'border-border bg-background'
                  }
                `}
                placeholder="至少6個字符"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
              確認密碼
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted" />
              </div>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`
                  w-full pl-10 pr-12 py-3 border rounded-lg
                  focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage
                  transition-colors placeholder:text-text-muted
                  ${errors.confirmPassword 
                    ? 'border-error bg-error/5' 
                    : 'border-border bg-background'
                  }
                `}
                placeholder="再次輸入密碼"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-white
              bg-morandi-sage hover:bg-morandi-sage-dark
              focus:ring-2 focus:ring-morandi-sage focus:ring-offset-2
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${isLoading ? 'animate-pulse' : ''}
            `}
          >
            {isLoading ? '註冊中...' : '建立帳戶'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-text-secondary">
            已經有帳戶了？{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-morandi-sage hover:text-morandi-sage-dark font-medium transition-colors"
              disabled={isLoading}
            >
              立即登入
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;