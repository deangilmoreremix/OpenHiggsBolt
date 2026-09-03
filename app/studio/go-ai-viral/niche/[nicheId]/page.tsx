import GoAiViralStudio from '@/src/apps/go-ai-viral/GoAiViralStudio'

export const metadata = {
  title: 'GO-Viral Niche Feed — SmartVideo GO',
  description: 'Browse AI video and image prompts filtered by business niche.',
}

export default function NichePage({ params }: { params: { nicheId: string } }) {
  return <GoAiViralStudio defaultNiche={params.nicheId} />
}
