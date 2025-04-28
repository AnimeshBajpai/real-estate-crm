import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Building, Briefcase, Plus, Users, User, Filter } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Company } from "@prisma/client";

export const metadata: Metadata = {
  title: "Companies | Real Estate CRM",
  description: "Manage real estate brokerage companies",
};

interface CompanyWithRelations extends Company {
  leadBroker: {
    id: string;
    name: string;
    phone: string;
  };
  _count: {
    employees: number;
    leads: number;
  };
}

function CompaniesPageContent({ companies }: { companies: CompanyWithRelations[] }) {
  return (
    <div className="companies-content">
      <div className="header">
        <div>
          <h1 className="title">Companies</h1>
          <p className="subtitle">
            Manage real estate brokerage companies
          </p>
        </div>
        <div className="actions">
          <Link href="/dashboard/companies/new">
            <Button className="add-btn">
              <Plus size={16} />
              Add Company
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="companies-grid">
        {companies.map((company) => (
          <Link 
            key={company.id} 
            href={`/dashboard/companies/${company.id}`}
            className="block"
          >
            <div className="company-card">
              <div className="company-card-header">
                <h3>{company.name}</h3>
                <div className="created-date">
                  Created {formatDate(company.createdAt)}
                </div>
              </div>
              <div className="company-card-content">
                <div className="company-info">
                  <div className="company-info-item">
                    <div className="company-info-label">Lead Broker</div>
                    <div className="company-info-value">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {company.leadBroker.name}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="company-stats">
                  <div className="stat-item">
                    <div className="stat-value">{company._count.employees}</div>
                    <div className="stat-label">Employees</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{company._count.leads}</div>
                    <div className="stat-label">Leads</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}        {companies.length === 0 && (
          <div className="empty-state">
            <Building size={48} className="empty-state-icon mx-auto" />
            <p className="empty-state-text">No companies found</p>
            <Link href="/dashboard/companies/new">
              <Button className="add-btn">
                <Plus size={16} />
                Add your first company
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return <div>Loading...</div>;
  }

  // Only super admins can access this page
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  try {
    const companies = await prisma.company.findMany({
      include: {
        leadBroker: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            employees: true,
            leads: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return <CompaniesPageContent companies={companies} />;  } catch (error) {
    console.error("Error fetching companies:", error);
    return (
      <div className="error-container">
        <h2 className="error-title">Error Loading Companies</h2>
        <p className="error-message">There was an error loading the companies data.</p>
        <p className="error-details">Technical details: {error instanceof Error ? error.message : String(error)}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }
}
