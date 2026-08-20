import { SignIn } from '@clerk/nextjs';
import brandAppearance from '../../../clerkAppearance';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <SignIn appearance={brandAppearance} />
    </div>
  );
}
