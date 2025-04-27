import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const companyId = session.user.companyId;
    
    let recentLeads = [];
    let pendingFollowUps = [];

    // Different queries based on user role
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can see most recent leads across all companies
      recentLeads = await prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { name: true }
          }
        }
      });
      
      // Follow-ups requiring action (pending & overdue)
      // Get the current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      pendingFollowUps = await prisma.followUp.findMany({
        where: { 
          completed: false,
          reminderDate: {
            lte: new Date() // Today or past (pending action)
          }
        },
        take: 5,
        orderBy: { reminderDate: 'asc' },
        include: {
          lead: {
            select: { name: true }
          },
          user: {
            select: { name: true }
          }
        }
      });

    } else if (userRole === 'LEAD_BROKER') {
      // Lead broker can only see their company data
      if (!companyId) {
        return new NextResponse("User has no associated company", { status: 400 });
      }

      // Get IDs of all sub-brokers and self
      const teamIds = await prisma.user.findMany({
        where: {
          companyId,
          OR: [
            { id: userId },            // Self
            { managerId: userId }      // Direct reports
          ]
        },
        select: { id: true }
      });
      
      const teamIdsArray = teamIds.map(user => user.id);

      // Recent leads for the team
      recentLeads = await prisma.lead.findMany({
        where: {
          companyId,
          ownerId: { in: teamIdsArray }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { name: true }
          }
        }
      });
      
      // Pending follow-ups for the team
      pendingFollowUps = await prisma.followUp.findMany({
        where: {
          userId: { in: teamIdsArray },
          completed: false,
          reminderDate: {
            lte: new Date() // Today or past (pending action)
          }
        },
        take: 5,
        orderBy: { reminderDate: 'asc' },
        include: {
          lead: {
            select: { name: true }
          },
          user: {
            select: { name: true }
          }
        }
      });
      
    } else if (userRole === 'SUB_BROKER') {
      // Sub broker can only see their own leads
      recentLeads = await prisma.lead.findMany({
        where: { ownerId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { name: true }
          }
        }
      });
      
      // And their own pending follow-ups
      pendingFollowUps = await prisma.followUp.findMany({
        where: {
          userId,
          completed: false,
          reminderDate: {
            lte: new Date() // Today or past (pending action)
          }
        },
        take: 5,
        orderBy: { reminderDate: 'asc' },
        include: {
          lead: {
            select: { name: true }
          },
          user: {
            select: { name: true }
          }
        }
      });
    }

    return NextResponse.json({
      recentLeads,
      pendingFollowUps
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard/activities:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
