import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApplicationStatus, RoleName } from "@prisma/client";

const PENDING_STATUSES = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.DRAFT,
  ApplicationStatus.DOCUMENTS_PENDING,
  ApplicationStatus.PAYMENT_PENDING,
];

const PROCESSING_STATUSES = [
  ApplicationStatus.UNDER_REVIEW,
  ApplicationStatus.DOCUMENT_VERIFICATION,
  ApplicationStatus.PROCESSED,
];

const COMPLETED_STATUSES = [
  ApplicationStatus.COMPLETED,
  ApplicationStatus.APPROVED,
];

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    // OPTIMIZATION: Run all independent count/aggregate queries in parallel
    // using Promise.all instead of sequential awaits. Each query hits the DB
    // concurrently so total latency ≈ slowest single query, not their sum.
    const [
      totalUsers,
      totalApplications,
      pendingCount,
      processingCount,
      completedCount,
      revenueAgg,
      serviceGroups,
      recentlySubmitted,
      recentlyCompleted,
    ] = await Promise.all([
      // 1. Count citizen users only
      this.prisma.user.count({
        where: { role: { name: RoleName.USER } },
      }),

      // 2. Total applications across all statuses
      this.prisma.application.count(),

      // 3. Pending / early-stage applications
      this.prisma.application.count({
        where: { status: { in: PENDING_STATUSES } },
      }),

      // 4. Applications under review/processing
      this.prisma.application.count({
        where: { status: { in: PROCESSING_STATUSES } },
      }),

      // 5. Completed / approved applications
      this.prisma.application.count({
        where: { status: { in: COMPLETED_STATUSES } },
      }),

      // 6. Revenue from successful payments
      this.prisma.application.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: "SUCCESS" },
      }),

      // 7. Service-wise breakdown — only IDs and counts (no heavy join)
      this.prisma.application.groupBy({
        by: ["serviceId"],
        _count: { id: true },
      }),

      // 8. Recently submitted (last 6) — only needed columns, no documents
      this.prisma.application.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          applicationNo: true,
          status: true,
          amount: true,
          createdAt: true,
          service: { select: { id: true, name: true, code: true } },
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      }),

      // 9. Recently completed (last 6) — no heavy document blob fetch
      this.prisma.application.findMany({
        where: { status: { in: COMPLETED_STATUSES } },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          applicationNo: true,
          status: true,
          amount: true,
          completedAt: true,
          updatedAt: true,
          service: { select: { id: true, name: true, code: true } },
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
          documents: {
            where: { documentType: "DELIVERED_FINAL_DOCUMENT" },
            select: { id: true, fileName: true, uploadedAt: true },
          },
        },
      }),
    ]);

    // Resolve service names from the groupBy results
    const serviceIds = serviceGroups.map((g) => g.serviceId);
    const services = serviceIds.length > 0
      ? await this.prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const serviceWiseStats = serviceGroups.map((g) => {
      const s = serviceMap.get(g.serviceId);
      return {
        serviceId: g.serviceId,
        serviceCode: s?.code || "UNKNOWN",
        serviceName: s?.name || "Service",
        count: g._count.id,
      };
    });

    return {
      totalUsers,
      totalApplications,
      pendingCount,
      processingCount,
      completedCount,
      totalRevenue: revenueAgg._sum.amount || 0,
      serviceWiseStats,
      recentlySubmitted,
      recentlyCompleted,
    };
  }
}
