import { MorandiColor } from '@/types';

export const MORANDI_COLORS = {
  'morandi-sage': {
    name: '鼠尾草綠',
    primary: '#9CAF9F',
    light: '#B5C4B8',
    dark: '#7A9D7D',
    bg: 'bg-morandi-sage',
    bgLight: 'bg-morandi-sage-light',
    bgDark: 'bg-morandi-sage-dark',
    text: 'text-morandi-sage-dark',
    border: 'border-morandi-sage',
  },
  'morandi-rose': {
    name: '玫瑰粉',
    primary: '#D4A5A5',
    light: '#E0B8B8',
    dark: '#C49292',
    bg: 'bg-morandi-rose',
    bgLight: 'bg-morandi-rose-light',
    bgDark: 'bg-morandi-rose-dark',
    text: 'text-morandi-rose-dark',
    border: 'border-morandi-rose',
  },
  'morandi-lavender': {
    name: '薰衣草紫',
    primary: '#B8A8C8',
    light: '#C8BADB',
    dark: '#A896B5',
    bg: 'bg-morandi-lavender',
    bgLight: 'bg-morandi-lavender-light',
    bgDark: 'bg-morandi-lavender-dark',
    text: 'text-morandi-lavender-dark',
    border: 'border-morandi-lavender',
  },
  'morandi-peach': {
    name: '蜜桃橘',
    primary: '#E8C4A0',
    light: '#F0D1B3',
    dark: '#DDB78D',
    bg: 'bg-morandi-peach',
    bgLight: 'bg-morandi-peach-light',
    bgDark: 'bg-morandi-peach-dark',
    text: 'text-morandi-peach-dark',
    border: 'border-morandi-peach',
  },
  'morandi-blue': {
    name: '霧霾藍',
    primary: '#A8B8C8',
    light: '#B8C4D1',
    dark: '#95A5B5',
    bg: 'bg-morandi-blue',
    bgLight: 'bg-morandi-blue-light',
    bgDark: 'bg-morandi-blue-dark',
    text: 'text-morandi-blue-dark',
    border: 'border-morandi-blue',
  },
  'morandi-cream': {
    name: '奶油色',
    primary: '#F0E6D6',
    light: '#F5EDE0',
    dark: '#E6D7C2',
    bg: 'bg-morandi-cream',
    bgLight: 'bg-morandi-cream-light',
    bgDark: 'bg-morandi-cream-dark',
    text: 'text-morandi-cream-dark',
    border: 'border-morandi-cream',
  },
  'morandi-grey': {
    name: '暖灰色',
    primary: '#C8C0B8',
    light: '#D1C9C4',
    dark: '#B5ADA5',
    bg: 'bg-morandi-grey',
    bgLight: 'bg-morandi-grey-light',
    bgDark: 'bg-morandi-grey-dark',
    text: 'text-morandi-grey-dark',
    border: 'border-morandi-grey',
  },
} as const;

export const getColorConfig = (color: MorandiColor) => {
  return MORANDI_COLORS[color];
};

export const getColorOptions = () => {
  return Object.entries(MORANDI_COLORS).map(([key, config]) => ({
    value: key as MorandiColor,
    label: config.name,
    color: config.primary,
  }));
};

export const getCategoryColors = (category: string): MorandiColor => {
  const categoryColorMap = {
    work: 'morandi-blue',
    personal: 'morandi-sage',
    friends: 'morandi-rose',
    family: 'morandi-peach',
    health: 'morandi-lavender',
    other: 'morandi-grey',
  } as const;

  return categoryColorMap[category as keyof typeof categoryColorMap] || 'morandi-sage';
};