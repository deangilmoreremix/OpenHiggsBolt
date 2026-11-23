export const STUDIO_GOALS = [
  { value: 'product-launch', label: 'Product launch', description: 'Announce a new product or feature' },
  { value: 'lead-gen', label: 'Lead generation', description: 'Capture qualified prospects' },
  { value: 'awareness', label: 'Brand awareness', description: 'Reach new audiences' },
  { value: 'engagement', label: 'Engagement', description: 'Drive replies, shares, comments' },
  { value: 'thought-leadership', label: 'Thought leadership', description: 'Establish authority and POV' },
  { value: 'sales', label: 'Direct sales', description: 'Drive purchases or sign-ups' },
] as const

const dashed = (v: string) => v.replace(/_/g, '-')
export const goalLabel = (value: string) => STUDIO_GOALS.find((g) => g.value === dashed(value))?.label ?? value
