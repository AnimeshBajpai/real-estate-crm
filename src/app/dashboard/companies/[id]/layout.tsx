import "../../companies/companies.css";
import "../../companies/company-detail.css";
import "../../companies/override.css";

export default function CompanyIdLayout({
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
