export const metadata = {
  title: 'LeadPro - Modern Lead Management for Real Estate',
  description: 'A streamlined platform for managing leads, tracking follow-ups, and boosting conversions in the real estate industry.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}
