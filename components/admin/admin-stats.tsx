"use client";

import { Users, Star, CreditCard, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface AdminStatsData {
  totalUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
  adminUsers: number;
  totalTools: number;
  featuredTools: number;
  subscriptionTools: number;
  advertisementTools: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  incompleteSubscriptions: number;
  totalRevenue: number;
  activeAds: number;
  expiredAds: number;
  mrr: number;
  churnRate: number;
}

interface TimeSeriesData {
  month: string;
  monthLabel: string;
  users: number;
  mrr: number;
  churnRate: number;
  adRevenue: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
}

interface AdminStatsProps {
  stats: AdminStatsData;
  timeSeriesData: TimeSeriesData[];
}

export function AdminStats({ stats, timeSeriesData }: AdminStatsProps) {
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Préparer les données pour les graphiques avec les vraies données temporelles
  const mrrData = timeSeriesData.map((item) => ({
    month: item.monthLabel,
    value: item.mrr / 100, // Convertir en dollars
  }));

  const chartConfig = {
    value: {
      label: "Value",
      color: "hsl(var(--muted-foreground))",
    },
  };

  const mainStats = [
    {
      label: "Users",
      value: stats.totalUsers,
      icon: Users,
    },
    {
      label: "Tools",
      value: stats.totalTools,
      icon: Star,
    },
    {
      label: "MRR",
      value: formatPrice(stats.mrr),
      icon: CreditCard,
    },
    {
      label: "Ad Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: TrendingUp,
    },
  ];

  const detailedStats = [
    {
      title: "User Stats",
      stats: [
        { label: "Verified users", value: stats.verifiedUsers },
        { label: "Banned users", value: stats.bannedUsers },
        { label: "Admin users", value: stats.adminUsers },
      ],
    },
    {
      title: "Tool Stats",
      stats: [
        { label: "Featured tools", value: stats.featuredTools },
        { label: "Subscription tools", value: stats.subscriptionTools },
        { label: "Advertisement tools", value: stats.advertisementTools },
      ],
    },
    {
      title: "Subscription Stats",
      stats: [
        { label: "Active subscriptions", value: stats.activeSubscriptions },
        { label: "Canceled subscriptions", value: stats.canceledSubscriptions },
        {
          label: "Incomplete subscriptions",
          value: stats.incompleteSubscriptions,
        },
      ],
    },
    {
      title: "Advertisement Stats",
      stats: [
        { label: "Active ads", value: stats.activeAds },
        { label: "Expired ads", value: stats.expiredAds },
        { label: "Total revenue", value: formatPrice(stats.totalRevenue) },
      ],
    },
  ];

  // Afficher seulement les graphiques si on a des données temporelles
  const hasTimeSeriesData = timeSeriesData && timeSeriesData.length > 0;

  return (
    <div className="space-y-6">
      {/* Revenue & Churn Analytics */}
      {hasTimeSeriesData && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Revenue & Churn Analytics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MRR Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Monthly Recurring Revenue
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {formatPrice(stats.mrr)}
                </span>
              </div>
              <div className="w-full h-48 flex items-end justify-center">
                <ChartContainer config={chartConfig} className="w-24 h-full">
                  <BarChart
                    data={mrrData}
                    margin={{
                      left: 8,
                      right: 8,
                      top: 8,
                    }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 9,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                      formatter={(value) => [
                        `$${Number(value).toFixed(0)}`,
                        "MRR",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--muted-foreground))"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            {/* Churn Rate Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Churn Rate
                </span>
              </div>
              <div className="w-full h-48 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  {/* Simple percentage display */}
                  <div className="text-2xl font-semibold text-foreground">
                    {stats.churnRate.toFixed(0)}%
                  </div>

                  {/* Simple progress bar */}
                  <div className="w-24">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground transition-all duration-500"
                        style={{ width: `${Math.min(stats.churnRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {stat.label}
                  </span>
                </div>
                <span className="text-lg font-semibold text-foreground flex-shrink-0">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {detailedStats.map((section) => (
          <div key={section.title} className="bg-muted/50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-foreground mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.stats.map((stat) => (
                <div key={stat.label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate pr-2">
                    {stat.label}
                  </span>
                  <span className="font-medium text-foreground flex-shrink-0">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
