import { redirect } from 'next/navigation'

export const metadata = {
  title: 'GO- AI Viral — SmartVideo GO',
  description: 'Continuously refreshed public feed of AI image and video prompts from X, with original authors, source links, preview media, and machine-readable datasets.',
}

export default function GoAiViralPage() {
  redirect('/studio/go-ai-viral')
}
