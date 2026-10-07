export default defineEventHandler(() => ({
  monthly: [
    {
      label: 'Total revenue',
      value: '$24,580',
      change: '+18.6%',
      points: [6, 11, 9, 17, 13, 20, 18, 25, 22, 31, 28, 35],
    },
    {
      label: 'Active users',
      value: '2,420',
      change: '+12.8%',
      points: [10, 8, 15, 13, 17, 22, 18, 26, 24, 29, 33, 31],
    },
    {
      label: 'Conversion rate',
      value: '4.82%',
      change: '+2.4%',
      points: [12, 18, 14, 20, 17, 23, 21, 19, 25, 27, 24, 30],
    },
  ],
  weekly: [
    {
      label: 'Total revenue',
      value: '$6,140',
      change: '+8.2%',
      points: [10, 8, 15, 19, 16, 29, 32],
    },
    { label: 'Active users', value: '684', change: '+6.1%', points: [8, 12, 10, 20, 18, 24, 30] },
    {
      label: 'Conversion rate',
      value: '4.96%',
      change: '+0.8%',
      points: [14, 12, 17, 14, 21, 24, 26],
    },
  ],
}))
