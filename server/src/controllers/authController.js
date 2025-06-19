const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'morandi-calendar-secret',
    { expiresIn: '7d' }
  );
};

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '請輸入有效的電子郵件地址',
    'string.empty': '電子郵件不能為空',
    'any.required': '電子郵件是必填項目'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密碼至少需要6個字符',
    'string.empty': '密碼不能為空',
    'any.required': '密碼是必填項目'
  }),
  displayName: Joi.string().min(2).max(50).required().messages({
    'string.min': '顯示名稱至少需要2個字符',
    'string.max': '顯示名稱不能超過50個字符',
    'string.empty': '顯示名稱不能為空',
    'any.required': '顯示名稱是必填項目'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '請輸入有效的電子郵件地址',
    'string.empty': '電子郵件不能為空',
    'any.required': '電子郵件是必填項目'
  }),
  password: Joi.string().required().messages({
    'string.empty': '密碼不能為空',
    'any.required': '密碼是必填項目'
  })
});

const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, displayName } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '該電子郵件已被註冊'
      });
    }

    const user = new User({
      email,
      password,
      displayName
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '註冊成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '註冊過程中發生錯誤'
    });
  }
};

const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '登入成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登入過程中發生錯誤'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶資料時發生錯誤'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updateSchema = Joi.object({
      displayName: Joi.string().min(2).max(50),
      avatar: Joi.string().uri(),
      preferences: Joi.object({
        notifications: Joi.object({
          email: Joi.boolean(),
          browser: Joi.boolean(),
          mobile: Joi.boolean()
        }),
        theme: Joi.string().valid('light', 'dark', 'morandi'),
        defaultCalendarView: Joi.string().valid('month', 'week', 'day'),
        timezone: Joi.string()
      })
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      value,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '個人資料更新成功',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新個人資料時發生錯誤'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};