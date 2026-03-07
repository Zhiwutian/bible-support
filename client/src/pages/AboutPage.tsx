import { SectionHeader } from '@/components/ui';

/**
 * Render a simple About page to demonstrate route-level screens.
 */
export function AboutPage() {
  return (
    <>
      <SectionHeader
        title="About This Starter"
        description="A full-stack TypeScript template with React, Express, PostgreSQL, and strong defaults."
      />
      <p className="text-sm text-slate-700">
        This route demonstrates how to organize page-level UI with React Router.
      </p>
    </>
  );
}
