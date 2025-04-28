"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface CompanyActionsProps {
  companyId: string;
}

export function CompanyActions({ companyId }: CompanyActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete company");
      }

      // Redirect to companies list
      router.push("/dashboard/companies");
      router.refresh();
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-4 flex justify-end space-x-2">
      <Link href={`/dashboard/companies/${companyId}/edit`}>
        <Button variant="outline" size="sm" className="flex items-center">
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
      </Link>
      <Button 
        variant="destructive" 
        size="sm" 
        className="flex items-center"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
