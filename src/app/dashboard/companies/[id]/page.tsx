import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCircle, Phone, Mail, Building } from "lucide-react";
import { CompanyActions } from "@/components/companies/company-actions";
import { ErrorState } from "@/components/companies/error-state";
import { ProfileButton } from "@/components/companies/profile-button";
import { EmployeeActions } from "@/components/companies/employee-actions";
import { LeadsViewButton } from "@/components/companies/leads-view-button";
import { BackLink } from "@/components/companies/back-link";

export const metadata: Metadata = {
  title: "Company Details | Real Estate CRM",
  description: "View and manage company details",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the ID as a string to avoid using params.id directly
  const companyId = String(params.id);
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return <div>Loading...</div>;
  }

  // Only super admins can access this page
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        leadBroker: true,
        employees: {
          orderBy: {
            name: "asc"
          }
        },
        leads: {
          take: 5,
          orderBy: {
            createdAt: "desc"
          },
          include: {
            owner: true
          }
        },
        _count: {
          select: {
            employees: true,
            leads: true
          }
        }
      }
    });    if (!company) {
      return <ErrorState message="The company you're looking for doesn't exist or has been deleted." />;
    }    return (
      <div className="company-detail">
        <div className="company-detail-header">
          <BackLink />
          <h1 className="company-detail-title">{company.name}</h1>
        </div>

        <div className="detail-cards-grid">          <Card className="bg-white shadow-sm border border-gray-100" style={{backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
            <CardHeader className="pb-3" style={{padding: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6'}}>
              <CardTitle className="flex items-center text-lg font-semibold" style={{fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#111827'}}>
                <Building className="mr-2 h-5 w-5 text-gray-600" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">              <div>
                <p className="field-label">Name</p>
                <p className="field-value">{company.name}</p>
              </div>
              <div>
                <p className="field-label">Created</p>
                <p className="field-value">{formatDate(company.createdAt)}</p>
              </div>              <div>
                <p className="field-label">Last Updated</p>
                <p className="field-value">{formatDate(company.updatedAt)}</p>
              </div>              <CompanyActions companyId={companyId} />
            </CardContent>
          </Card>          <Card className="bg-white shadow-sm border border-gray-100" style={{backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
            <CardHeader className="pb-3" style={{padding: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6'}}>
              <CardTitle className="flex items-center text-lg font-semibold" style={{fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#111827'}}>
                <UserCircle className="mr-2 h-5 w-5 text-gray-600" />
                Lead Broker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">              <div>
                <p className="field-label">Name</p>
                <p className="field-value">{company.leadBroker.name}</p>
              </div>
              <div>
                <p className="field-label">Phone</p>
                <p className="field-value">{company.leadBroker.phone}</p>
              </div>
              <div>
                <p className="field-label">Role</p>
                <p className="field-value">Lead Broker</p>
              </div>              <ProfileButton userId={company.leadBroker.id} />
            </CardContent>
          </Card>
        </div>        <div className="detail-section">          <Card className="bg-white shadow-sm border border-gray-100" style={{backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
            <CardHeader className="pb-3" style={{padding: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6'}}>
              <CardTitle className="detail-section-title" style={{fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#111827'}}>                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Users className="icon h-5 w-5 text-gray-600" />
                    <span className="ml-2">Employees ({company._count.employees})</span>
                  </div>
                  <EmployeeActions companyId={companyId} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent style={{padding: '1.25rem'}}>{company.employees.length === 0 ? (
                <div className="empty-state p-6">
                  <Users size={32} className="empty-state-icon mx-auto" />
                  <p className="empty-state-text">No employees found</p>
                </div>
              ) : (
                <div className="employee-list">
                  {company.employees.map((employee) => (
                    <div key={employee.id} className="employee-item">
                      <div className="employee-avatar">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div className="employee-info">
                        <div className="employee-name">{employee.name}</div>
                        <div className="employee-role">{employee.role === "LEAD_BROKER" ? "Lead Broker" : "Sub-broker"}</div>
                        <div className="employee-contact">
                          <Phone className="icon h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}              {/* Removed "View All Employees" button since it's now in the EmployeeActions component */}
            </CardContent>
          </Card>
        </div>        <div className="detail-section">
          <Card className="bg-white shadow-sm border border-gray-100" style={{backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'}}>
            <CardHeader className="pb-3" style={{padding: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6'}}>
              <CardTitle className="detail-section-title" style={{fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#111827'}}>                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Users className="icon h-5 w-5 text-gray-600" />
                    <span className="ml-2">Recent Leads ({company._count.leads})</span>
                  </div>
                  <LeadsViewButton />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent style={{padding: '1.25rem'}}>
              {company.leads.length === 0 ? (
                <div className="empty-state p-6">
                  <Users size={32} className="empty-state-icon mx-auto" />
                  <p className="empty-state-text">No leads found</p>
                </div>
              ) : (                <div className="lead-list">
                  {company.leads.map((lead) => (
                    <div key={lead.id} className="lead-item">
                      <div className="lead-header">
                        <p className="lead-name">{lead.name}</p>
                        <span className="lead-status">
                          {lead.status}
                        </span>
                      </div>
                      <div className="lead-details">
                        <div className="lead-detail">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="lead-detail">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        <div className="lead-detail">
                          <UserCircle className="h-3 w-3" />
                          <span>{lead.owner.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );  } catch (error) {
    console.error("Error fetching company details:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return <ErrorState message={`Failed to load company details: ${errorMessage}`} />;
  }
}
