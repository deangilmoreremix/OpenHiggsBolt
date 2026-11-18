import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Warmbly Studio — SmartVideo GO',
  description: 'Cold email, mailbox warmup, unified inbox and CRM.',
}

export default function WarmblyPage() {
  redirect('/studio/warmbly')
}
