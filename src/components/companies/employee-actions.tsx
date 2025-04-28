"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmployeeActionsProps {
  companyId: string;
}

export function EmployeeActions({ companyId }: EmployeeActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/dashboard/companies/${companyId}/employees/new`}>
        <Button size="sm">Add Employee</Button>
      </Link>
      <Link href={`/dashboard/companies/${companyId}/employees`}>
        <Button variant="outline">View All Employees</Button>
      </Link>
    </div>
  );
}
