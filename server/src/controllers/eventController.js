const Joi = require('joi');
const Event = require('../models/Event');
const { startOfMonth, endOfMonth } = require('date-fns');
const { generateRecurrenceOccurrences } = require('../utils/recurrence');

// 基礎schema
const baseEventSchema = {
  title: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': '活動標題不能為空',
    'string.max': '活動標題不能超過100個字符',
    'any.required': '活動標題是必填項目'
  }),
  description: Joi.string().max(1000).allow(''),
  startDate: Joi.date().required().messages({
    'any.required': '開始時間是必填項目'
  }),
  endDate: Joi.date().min(Joi.ref('startDate')).required().messages({
    'date.min': '結束時間不能早於開始時間',
    'any.required': '結束時間是必填項目'
  }),
  isAllDay: Joi.boolean().default(false),
  color: Joi.string().valid(
    'morandi-sage', 'morandi-rose', 'morandi-lavender',
    'morandi-peach', 'morandi-blue', 'morandi-cream', 'morandi-grey'
  ).default('morandi-sage'),
  category: Joi.string().valid('work', 'personal', 'friends', 'family', 'health', 'other').default('personal'),
  location: Joi.string().max(200).allow(''),
  privacy: Joi.string().valid('private', 'shared', 'public', 'group_only').default('private'),
  // 團體相關欄位
  group: Joi.string().hex().length(24).allow(null).optional(),
  groupEventType: Joi.string().valid('meeting', 'deadline', 'social', 'project', 'other').default('other'),
  requiresAttendance: Joi.boolean().default(false),
  maxAttendees: Joi.number().integer().min(1).allow(null).optional(),
  status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').default('published'),
  reminders: Joi.array().items(
    Joi.string().valid('5min', '15min', '30min', '1hour', '1day', '1week')
  ).default([])
};

// 重複設定schema
const recurrenceSchema = Joi.object({
  type: Joi.string().valid('none', 'daily', 'weekly', 'monthly', 'yearly').default('none'),
  interval: Joi.number().integer().min(1).max(999).default(1),
  endDate: Joi.date().allow(null).optional(),
  occurrences: Joi.number().integer().min(1).max(999).allow(null).optional(),
  endType: Joi.string().valid('never', 'date', 'count').default('never')
}).default({ type: 'none', interval: 1, endType: 'never' });

// 創建活動schema
const createEventSchema = Joi.object({
  ...baseEventSchema,
  recurrence: Joi.object({
    type: Joi.string().valid('none', 'daily', 'weekly', 'monthly', 'yearly').default('none'),
    interval: Joi.number().integer().min(1).max(999).default(1),
    endDate: Joi.date().allow(null).optional(),
    occurrences: Joi.number().integer().min(1).max(999).allow(null).optional(),
    endType: Joi.string().valid('never', 'date', 'count').default('never')
  }).default({ type: 'none', interval: 1, endType: 'never' }).optional()
});

const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100),
  description: Joi.string().max(1000).allow(''),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  isAllDay: Joi.boolean(),
  color: Joi.string().valid(
    'morandi-sage', 'morandi-rose', 'morandi-lavender',
    'morandi-peach', 'morandi-blue', 'morandi-cream', 'morandi-grey'
  ),
  category: Joi.string().valid('work', 'personal', 'friends', 'family', 'health', 'other'),
  location: Joi.string().max(200).allow(''),
  privacy: Joi.string().valid('private', 'shared', 'public', 'group_only'),
  // 團體相關欄位
  group: Joi.string().hex().length(24).allow(null),
  groupEventType: Joi.string().valid('meeting', 'deadline', 'social', 'project', 'other'),
  requiresAttendance: Joi.boolean(),
  maxAttendees: Joi.number().integer().min(1).allow(null),
  status: Joi.string().valid('draft', 'published', 'cancelled', 'completed'),
  reminders: Joi.array().items(
    Joi.string().valid('5min', '15min', '30min', '1hour', '1day', '1week')
  ),
  recurrence: Joi.object({
    type: Joi.string().valid('none', 'daily', 'weekly', 'monthly', 'yearly').default('none'),
    interval: Joi.number().integer().min(1).max(999).default(1),
    endDate: Joi.date().allow(null).optional(),
    occurrences: Joi.number().integer().min(1).max(999).allow(null).optional(),
    endType: Joi.string().valid('never', 'date', 'count').default('never')
  }).default({ type: 'none', interval: 1, endType: 'never' }).optional()
});

const createEvent = async (req, res) => {
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { error, value } = createEventSchema.validate(req.body, { 
      allowUnknown: false,
      stripUnknown: false 
    });
    if (error) {
      console.log('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    console.log('Validated value:', JSON.stringify(value, null, 2));

    const event = new Event({
      ...value,
      creator: req.user._id
    });

    await event.save();
    await event.populate('creator', 'displayName email avatar');
    if (event.group) {
      await event.populate('group', 'name avatar');
    }

    res.status(201).json({
      success: true,
      message: '活動創建成功',
      data: { event }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: '創建活動時發生錯誤'
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const { 
      year, 
      month, 
      startDate, 
      endDate, 
      search, 
      category, 
      color, 
      searchStartDate, 
      searchEndDate,
      limit = 100,
      page = 1
    } = req.query;
    
    // 使用 Event 模型的 getUserVisibleEvents 方法來獲取用戶可見的所有活動（包括團體活動）
    let dateRange = {};
    
    if (searchStartDate && searchEndDate) {
      dateRange.startDate = searchStartDate;
      dateRange.endDate = searchEndDate;
    } else if (year && month) {
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      dateRange.startDate = startOfMonth(date);
      dateRange.endDate = endOfMonth(date);
    } else if (startDate && endDate) {
      dateRange.startDate = startDate;
      dateRange.endDate = endDate;
    }

    // 搜尋條件
    const searchConditions = [];
    
    // 文字搜尋（標題和描述）
    if (search && search.trim()) {
      searchConditions.push({
        $or: [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } }
        ]
      });
    }
    
    // 分類篩選
    if (category && category !== 'all') {
      searchConditions.push({ category });
    }
    
    // 顏色篩選
    if (color && color !== 'all') {
      searchConditions.push({ color });
    }

    let rangeStart, rangeEnd;

    // 日期範圍處理
    if (searchStartDate && searchEndDate) {
      // 搜尋專用的日期範圍
      rangeStart = new Date(searchStartDate);
      rangeEnd = new Date(searchEndDate);
      searchConditions.push({
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
          { 
            startDate: { $lte: rangeStart },
            endDate: { $gte: rangeEnd }
          }
        ]
      });
    } else if (year && month) {
      // 月視圖的日期範圍
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      rangeStart = startOfMonth(date);
      rangeEnd = endOfMonth(date);
      
      searchConditions.push({
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
          { 
            startDate: { $lte: rangeStart },
            endDate: { $gte: rangeEnd }
          }
        ]
      });
    } else if (startDate && endDate) {
      // 自定義日期範圍
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
      
      searchConditions.push({
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
          { 
            startDate: { $lte: rangeStart },
            endDate: { $gte: rangeEnd }
          }
        ]
      });
    }

    // 使用 Event 模型的 getUserVisibleEvents 方法獲取用戶可見的活動（包括團體活動）
    const events = await Event.getUserVisibleEvents(req.user._id, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // 手動應用額外的篩選條件（搜尋、分類、顏色）
    let filteredEvents = events;
    
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        (event.description && event.description.toLowerCase().includes(searchTerm))
      );
    }
    
    if (category && category !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.category === category);
    }
    
    if (color && color !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.color === color);
    }

    // 計算總數
    const totalCount = filteredEvents.length;
    const baseEvents = filteredEvents;

    // 如果有日期範圍，生成重複活動
    let allEvents = [...baseEvents];
    
    // 重複活動處理已經在 getUserVisibleEvents 中處理了，這裡不需要重複處理

    // 按開始時間排序
    allEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.json({
      success: true,
      data: { 
        events: allEvents,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        },
        filters: {
          search: search || null,
          category: category || null,
          color: color || null,
          dateRange: searchStartDate && searchEndDate ? {
            start: searchStartDate,
            end: searchEndDate
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: '獲取活動時發生錯誤'
    });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      $or: [
        { creator: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    })
    .populate('creator', 'displayName email avatar')
    .populate('sharedWith.user', 'displayName email avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '找不到該活動'
      });
    }

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: '獲取活動詳情時發生錯誤'
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { error, value } = updateEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        creator: req.user._id
      },
      value,
      { new: true, runValidators: true }
    ).populate('creator', 'displayName email avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '找不到該活動或沒有權限編輯'
      });
    }

    res.json({
      success: true,
      message: '活動更新成功',
      data: { event }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: '更新活動時發生錯誤'
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        creator: req.user._id
      },
      { isDeleted: true },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '找不到該活動或沒有權限刪除'
      });
    }

    res.json({
      success: true,
      message: '活動刪除成功'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: '刪除活動時發生錯誤'
    });
  }
};

// 專門的搜尋API
const searchEvents = async (req, res) => {
  try {
    const { 
      q: search, 
      category, 
      color, 
      startDate, 
      endDate,
      limit = 50,
      page = 1,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    let query = {
      $or: [
        { creator: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    };

    const searchConditions = [];
    
    // 文字搜尋
    if (search && search.trim()) {
      searchConditions.push({
        $or: [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
          { location: { $regex: search.trim(), $options: 'i' } }
        ]
      });
    }
    
    // 篩選條件
    if (category && category !== 'all') {
      searchConditions.push({ category });
    }
    
    if (color && color !== 'all') {
      searchConditions.push({ color });
    }
    
    // 日期範圍
    if (startDate && endDate) {
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      searchConditions.push({
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
          { 
            startDate: { $lte: rangeStart },
            endDate: { $gte: rangeEnd }
          }
        ]
      });
    }

    if (searchConditions.length > 0) {
      query.$and = searchConditions;
    }

    // 排序設定
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const totalCount = await Event.countDocuments(query);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(query)
      .populate('creator', 'displayName email avatar')
      .populate('sharedWith.user', 'displayName email avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        },
        query: {
          search: search || null,
          category: category || null,
          color: color || null,
          dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: '搜尋活動時發生錯誤'
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  searchEvents
};