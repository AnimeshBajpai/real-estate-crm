import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Session debug:", { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userId: session?.user?.id,
        companyId: session?.user?.companyId 
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const companyId = searchParams.get('companyId'); // New parameter for filtering by company
    
    console.log("Session found:", {
      userId: session.user.id,
      companyId: session.user.companyId,
      role: session.user.role,
      requestedOwnerId: ownerId,
      requestedCompanyId: companyId
    });

    // Determine which company to filter by
    let filterCompanyId: string | undefined;
    
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admins can filter by any company or view all companies
      filterCompanyId = companyId || undefined; 
    } else {
      // Non-super admins are restricted to their own company
      filterCompanyId = session.user.companyId;
    }

    const leads = await prisma.lead.findMany({
      where: {
        // Apply the company filter - for super admins this might be undefined (all companies)
        ...(filterCompanyId ? { companyId: filterCompanyId } : {}),
        
        // If ownerId is provided in the request, filter by that ownerId
        // Otherwise, for SUB_BROKER users, show only their own leads
        ...(ownerId ? 
          { ownerId } : 
          (session.user.role === 'SUB_BROKER' && {
            ownerId: session.user.id
          })
        )
      },
      include: {
        company: {
          select: {
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error in GET /api/leads:", error);
    return new NextResponse(
      "Internal Server Error", 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const data = await req.json();
    const { name, phone, email, status, notes, assignedOwnerId, companyId } = data;

    if (!name || !phone || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Determine company ID based on role
    let leadCompanyId = session.user.companyId;
    
    // For SUPER_ADMIN, use the provided company ID
    if (session.user.role === 'SUPER_ADMIN') {
      if (!companyId) {
        return new NextResponse("Super admin must specify a company ID", { status: 400 });
      }
      leadCompanyId = companyId;
    } 
    // For non-super admins, ensure they have a company assigned
    else if (!leadCompanyId) {
      return new NextResponse("User does not have a company assigned", { status: 400 });
    }
    
    // Determine owner based on user role and assignedOwnerId
    let ownerId = session.user.id; // Default owner is the current user
    
    // If user is a LEAD_BROKER and they provided an assignedOwnerId, use that
    if (session.user.role === 'LEAD_BROKER' && assignedOwnerId) {
      // Verify that the assigned owner is a SUB_BROKER in the same company
      const assignedOwner = await prisma.user.findUnique({
        where: {
          id: assignedOwnerId,
          role: 'SUB_BROKER',
          companyId: leadCompanyId
        }
      });
      
      if (assignedOwner) {
        ownerId = assignedOwnerId;
      } else {
        return new NextResponse("Invalid assigned owner", { status: 400 });
      }
    }    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        status,
        notes,
        ownerId: ownerId,
        companyId: leadCompanyId
      },
      include: {
        company: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error in POST /api/leads:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error", 
      { status: 500 }
    );
  }
}
