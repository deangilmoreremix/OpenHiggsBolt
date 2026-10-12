import DeploymentCenter from '@/components/reseller/DeploymentCenter';

export const metadata = {
  title: 'Reseller Deployment Center — SmartVideo GO AI Apps',
  description:
    'How to buy the SmartVideo AI Apps reseller packages, download the source code, set up one shared customer-owned Supabase project with isolated per-app schemas, and deploy every app to your own Vercel account.',
};

export default function ResellerDeploymentPage() {
  return <DeploymentCenter />;
}
