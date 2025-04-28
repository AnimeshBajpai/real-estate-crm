import "./companies.css";
import "./company-detail.css";
import "./company-form.css";

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
