import { SignUp } from '@clerk/nextjs';
import brandAppearance from '../../../clerkAppearance';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <SignUp appearance={brandAppearance} />
    </div>
  );
}
