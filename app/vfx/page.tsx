import { redirect } from 'next/navigation'

export const metadata = {
  title: 'VFX Studio — Open Generative AI',
  description: 'AI effects, motion controls, and VFX for your footage.',
}

export default function VFXPage() {
  redirect('/studio/vfx-studio')
}
