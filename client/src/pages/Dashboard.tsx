import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, GraduationCap, UserPlus } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CourseChart } from "@/components/dashboard/CourseChart";
import { TrendsChart } from "@/components/dashboard/TrendsChart";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="w-full sm:w-[95%] lg:w-[90%] mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 flex-1">
        {/* Page Title */}


        {isLoading ? (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[100px] md:h-[120px]" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Skeleton className="h-[300px] md:h-[400px]" />
              <Skeleton className="h-[250px] md:h-[300px]" />
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">Failed to load dashboard data. Please try again later.</p>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <MetricCard
                title="Total Students"
                value={data.metrics.total}
                icon={Users}
              />
              <MetricCard
                title="Active/Enrolled"
                value={data.metrics.active}
                icon={UserCheck}
              />
              <MetricCard
                title="Graduated"
                value={data.metrics.graduated}
                icon={GraduationCap}
              />
              <MetricCard
                title="New This Month"
                value={data.metrics.newThisMonth}
                icon={UserPlus}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <Card>
                <CardHeader className="pb-2 sm:pb-3 md:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Students by Course</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Distribution across all courses</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 md:px-6 pb-3 sm:pb-6">
                  <CourseChart data={data.courseDistribution} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-3 md:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Registration Trends</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Student registrations over time</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 md:px-6 pb-3 sm:pb-6">
                  <TrendsChart
                    monthlyData={data.monthlyTrends}
                    weeklyData={data.weeklyTrends}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
