import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  metrics: {
    total: number;
    active: number;
    graduated: number;
    newThisMonth: number;
  };
  courseDistribution: Array<{ course: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  monthlyTrends: Array<{ period: string; count: number }>;
  weeklyTrends: Array<{ period: string; count: number }>;
}

export function useDashboardData() {
  return useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true
  });
}
