import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Companies | Real Estate CRM",
  description: "Manage real estate brokerage companies",
};

const prisma = new PrismaClient();

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return <div>Loading...</div>;
  }

  // Only super admins can access this page
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage real estate brokerage companies
          </p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Link 
            key={company.id} 
            href={`/dashboard/companies/${company.id}`}
            className="block"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{company.name}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(company.createdAt)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Lead Broker</p>
                    <p className="text-sm">{company.leadBroker.name}</p>
                  </div>
                  <div className="flex space-x-4">
                    <div>
                      <p className="text-sm font-medium">Employees</p>
                      <p className="text-sm">{company._count.employees}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Leads</p>
                      <p className="text-sm">{company._count.leads}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        
        {companies.length === 0 && (
          <div className="col-span-full flex justify-center items-center p-8 text-center">
            <div>
              <p className="text-muted-foreground">No companies found</p>
              <Link href="/dashboard/companies/new">
                <Button className="mt-4" variant="outline">
                  Add your first company
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
