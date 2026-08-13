import AcademyCourse from '@/components/academy/AcademyCourse';
import { getAllTracks } from '@/lib/academyLessons';

export const metadata = {
  title: 'Academy — AI Video Ads & UGC · SmartVideo GO AI',
  description:
    'Imported course tracks on AI UGC video ads and more: rebranded for SmartVideo GO AI. Lessons, example media, and interactive templates wired into the Create-With-AI recipes.',
};

export default function AcademyPage() {
  const tracks = getAllTracks();
  return <AcademyCourse tracks={tracks} />;
}
