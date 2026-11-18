import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Outreach Studio — SmartVideo GO',
  description: 'Cold outreach, mailbox warmup, unified inbox and CRM.',
}

export default function OutreachPage() {
  redirect('/studio/outreach')
}
