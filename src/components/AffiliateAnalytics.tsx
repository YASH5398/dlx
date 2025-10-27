import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  UserPlus, 
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  impressions: number;
  clicks: number;
  joins: number;
  conversionRate: number;
  totalEarnings: number;
  period: '7d' | '30d' | '90d' | 'all';
}

interface AffiliateAnalyticsProps {
  data: AnalyticsData;
  period: '7d' | '30d' | '90d' | 'all';
  onPeriodChange: (period: '7d' | '30d' | '90d' | 'all') => void;
}

export default function AffiliateAnalytics({ data, period, onPeriodChange }: AffiliateAnalyticsProps) {
  const periods = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' }
  ] as const;

  const stats = [
    {
      label: 'Impressions',
      value: data.impressions,
      icon: Eye,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      label: 'Clicks',
      value: data.clicks,
      icon: MousePointer,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      label: 'Signups',
      value: data.joins,
      icon: UserPlus,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      label: 'Earnings',
      value: `$${data.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    }
  ];

  const conversionRate = data.clicks > 0 ? (data.joins / data.clicks) * 100 : 0;
  const clickThroughRate = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Analytics Overview
          </CardTitle>
          <CardDescription className="text-slate-400">
            Track your affiliate performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => onPeriodChange(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === p.key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-slate-800/40 backdrop-blur-sm border-slate-700/50 hover:${stat.borderColor} transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Conversion Rate
            </CardTitle>
            <CardDescription className="text-slate-400">
              Percentage of clicks that result in signups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {conversionRate.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(conversionRate, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-slate-400">
                {data.joins} signups from {data.clicks} clicks
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Click-Through Rate */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              Click-Through Rate
            </CardTitle>
            <CardDescription className="text-slate-400">
              Percentage of impressions that result in clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {clickThroughRate.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(clickThroughRate, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-slate-400">
                {data.clicks} clicks from {data.impressions} impressions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Trends
          </CardTitle>
          <CardDescription className="text-slate-400">
            Track your performance over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Chart visualization coming soon</p>
              <p className="text-slate-500 text-sm">Track your performance trends over time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Earnings Breakdown
          </CardTitle>
          <CardDescription className="text-slate-400">
            Understand your revenue sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${data.totalEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">Total Earnings</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {data.joins}
              </div>
              <div className="text-sm text-slate-400">Successful Referrals</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${data.joins > 0 ? (data.totalEarnings / data.joins).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-slate-400">Avg. per Referral</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
