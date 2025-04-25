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

    // Extract ownerId from the request URL if provided
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    
    console.log("Session found:", {
      userId: session.user.id,
      companyId: session.user.companyId,
      role: session.user.role,
      requestedOwnerId: ownerId
    });    const leads = await prisma.lead.findMany({
      where: {
        companyId: session.user.companyId,
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
    
    if (!session?.user?.id || !session?.user?.companyId) {
      console.log("No session, user ID, or company ID found");
      return new NextResponse("Unauthorized", { status: 401 });
    }    const data = await req.json();
    const { name, phone, email, status, notes, assignedOwnerId } = data;

    if (!name || !phone || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
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
          companyId: session.user.companyId
        }
      });
      
      if (assignedOwner) {
        ownerId = assignedOwnerId;
      } else {
        return new NextResponse("Invalid assigned owner", { status: 400 });
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        status,
        notes,
        ownerId: ownerId,
        companyId: session.user.companyId
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
