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
  privacy: Joi.string().valid('private', 'shared', 'public').default('private'),
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
  privacy: Joi.string().valid('private', 'shared', 'public'),
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
    const { year, month, startDate, endDate } = req.query;
    let query = {
      $or: [
        { creator: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    };

    let rangeStart, rangeEnd;

    if (year && month) {
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      rangeStart = startOfMonth(date);
      rangeEnd = endOfMonth(date);
      
      query.$and = [{
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
          { 
            startDate: { $lte: rangeStart },
            endDate: { $gte: rangeEnd }
          }
        ]
      }];
    } else if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
      
      query.$and = [{
        $or: [
          { startDate: { $gte: rangeStart, $lte: rangeEnd } },
          { endDate: { $gte: rangeStart, $lte: rangeEnd } },
          { 
            startDate: { $lte: rangeStart },
            endDate: { $gte: rangeEnd }
          }
        ]
      }];
    }

    // 獲取基礎活動
    const baseEvents = await Event.find(query)
      .populate('creator', 'displayName email avatar')
      .populate('sharedWith.user', 'displayName email avatar')
      .sort({ startDate: 1 });

    // 如果有日期範圍，生成重複活動
    let allEvents = [...baseEvents];
    
    if (rangeStart && rangeEnd) {
      // 找出有重複設定的活動（包括範圍外的活動）
      const recurringQuery = {
        $or: [
          { creator: req.user._id },
          { 'sharedWith.user': req.user._id }
        ],
        'recurrence.type': { $ne: 'none' }
      };

      const recurringEvents = await Event.find(recurringQuery)
        .populate('creator', 'displayName email avatar')
        .populate('sharedWith.user', 'displayName email avatar');

      // 為每個重複活動生成重複實例
      for (const recurringEvent of recurringEvents) {
        const recurrenceOccurrences = generateRecurrenceOccurrences(
          recurringEvent.toObject(),
          recurringEvent.recurrence,
          rangeStart,
          rangeEnd
        );
        allEvents.push(...recurrenceOccurrences);
      }
    }

    // 按開始時間排序
    allEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.json({
      success: true,
      data: { events: allEvents }
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

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
};