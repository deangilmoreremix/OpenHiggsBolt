import { redirect } from 'next/navigation'

export const metadata = {
  title: 'VFX Studio — SmartVideo GO',
  description: 'AI effects, motion controls, and VFX for your footage.',
}

export default function VFXPage() {
  redirect('/studio/vfx-studio')
}
