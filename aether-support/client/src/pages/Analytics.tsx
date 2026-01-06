import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, Clock, Phone, MessageCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function Analytics() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const analyticsQuery = trpc.analytics.overview.useQuery({
    dateFrom,
    dateTo,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = analyticsQuery.data || {
    totalSessions: 0,
    activeSessions: 0,
    endedSessions: 0,
    missedSessions: 0,
    avgDuration: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
              <span className="text-xl font-bold text-slate-900">{APP_TITLE}</span>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/widgets">
              <a className="text-slate-600 hover:text-slate-900">Widgets</a>
            </Link>
            <Link href="/dashboard">
              <a className="text-slate-600 hover:text-slate-900">Dashboard</a>
            </Link>
            <Link href="/agent-chat">
              <a className="text-slate-600 hover:text-slate-900">Agent Chat</a>
            </Link>
            <span className="text-sm text-slate-600">{user?.name}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Track your customer support performance</p>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageCircle className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-slate-500 mt-1">All time conversations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
              <p className="text-xs text-slate-500 mt-1">Currently ongoing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.endedSessions}</div>
              <p className="text-xs text-slate-500 mt-1">Successfully handled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(stats.avgDuration / 60)}m {stats.avgDuration % 60}s
              </div>
              <p className="text-xs text-slate-500 mt-1">Per session</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Status Breakdown</CardTitle>
              <CardDescription>Distribution of session outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-slate-600">{stats.endedSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  <span className="text-sm text-slate-600">{stats.activeSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Missed</span>
                  <span className="text-sm text-slate-600">{stats.missedSessions}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-slate-600">
                    {stats.totalSessions > 0
                      ? Math.round(((stats.endedSessions + stats.activeSessions) / stats.totalSessions) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Miss Rate</span>
                  <span className="text-sm text-slate-600">
                    {stats.totalSessions > 0
                      ? Math.round((stats.missedSessions / stats.totalSessions) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
