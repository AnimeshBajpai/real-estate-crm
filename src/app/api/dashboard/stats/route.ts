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

    let leadsCount = 0;
    let followUpsCount = 0;
    let pendingTodayFollowUps = 0;
    let companiesCount = 0;
    let revenueEstimate = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Different queries based on user role
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can see everything
      [leadsCount, followUpsCount, pendingTodayFollowUps, companiesCount] = await Promise.all([
        prisma.lead.count(),
        prisma.followUp.count({
          where: { completed: false }
        }),
        prisma.followUp.count({
          where: {
            completed: false,
            reminderDate: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        prisma.company.count()
      ]);
      
      // Calculate estimated revenue (assuming each lead is worth $10k on average)
      const closedWonLeadsCount = await prisma.lead.count({
        where: { status: 'CLOSED_WON' }
      });
      revenueEstimate = closedWonLeadsCount * 10000;

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

      [leadsCount, followUpsCount, pendingTodayFollowUps] = await Promise.all([
        prisma.lead.count({
          where: {
            companyId,
            ownerId: { in: teamIdsArray }
          }
        }),
        prisma.followUp.count({
          where: {
            completed: false,
            userId: { in: teamIdsArray }
          }
        }),
        prisma.followUp.count({
          where: {
            completed: false,
            userId: { in: teamIdsArray },
            reminderDate: {
              gte: today,
              lt: tomorrow
            }
          }
        })
      ]);
      
      // Only one company for lead broker
      companiesCount = 1;

      // Calculate estimated revenue for this company
      const closedWonLeadsCount = await prisma.lead.count({
        where: { 
          companyId,
          status: 'CLOSED_WON',
          ownerId: { in: teamIdsArray }
        }
      });
      revenueEstimate = closedWonLeadsCount * 10000;
      
    } else if (userRole === 'SUB_BROKER') {
      // Sub broker can only see their own leads and follow-ups
      [leadsCount, followUpsCount, pendingTodayFollowUps] = await Promise.all([
        prisma.lead.count({
          where: { ownerId: userId }
        }),
        prisma.followUp.count({
          where: {
            userId,
            completed: false
          }
        }),
        prisma.followUp.count({
          where: {
            userId,
            completed: false,
            reminderDate: {
              gte: today,
              lt: tomorrow
            }
          }
        })
      ]);
      
      // Only one company for sub broker
      companiesCount = companyId ? 1 : 0;

      // Calculate estimated revenue for this sub broker
      const closedWonLeadsCount = await prisma.lead.count({
        where: { 
          ownerId: userId,
          status: 'CLOSED_WON' 
        }
      });
      revenueEstimate = closedWonLeadsCount * 10000;
    }

    return NextResponse.json({
      leadsCount,
      followUpsCount,
      pendingTodayFollowUps,
      companiesCount,
      revenue: revenueEstimate.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard/stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
