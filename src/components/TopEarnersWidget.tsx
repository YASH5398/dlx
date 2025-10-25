import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

interface TopEarner {
  userId: string;
  userName: string;
  userEmail: string;
  totalEarnings: number;
  avatar?: string;
  trend?: 'up' | 'down' | 'neutral';
  previousWeekEarnings?: number;
}

interface TopEarnersWidgetProps {
  className?: string;
}

export default function TopEarnersWidget({ className = '' }: TopEarnersWidgetProps) {
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadTopEarners();
  }, []);

  const loadTopEarners = async () => {
    try {
      setLoading(true);
      
      // Calculate date range for last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      // Get orders from last 7 days
      const ordersQuery = query(
        collection(firestore, 'orders'),
        where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
        where('timestamp', '<=', Timestamp.fromDate(now)),
        where('status', '==', 'Completed')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const earningsMap = new Map<string, { total: number; userName: string; userEmail: string }>();
      
      // Calculate earnings per user
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        const amount = Number(data.amountUsd || 0);
        const commission = amount * 0.7; // 70% commission rate
        
        if (userId && commission > 0) {
          const existing = earningsMap.get(userId) || { total: 0, userName: data.userName || 'User', userEmail: data.userEmail || '' };
          existing.total += commission;
          earningsMap.set(userId, existing);
        }
      });
      
      // Get previous week earnings for trend calculation
      const previousWeekQuery = query(
        collection(firestore, 'orders'),
        where('timestamp', '>=', Timestamp.fromDate(fourteenDaysAgo)),
        where('timestamp', '<=', Timestamp.fromDate(sevenDaysAgo)),
        where('status', '==', 'Completed')
      );
      
      const previousWeekSnapshot = await getDocs(previousWeekQuery);
      const previousWeekEarnings = new Map<string, number>();
      
      previousWeekSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        const amount = Number(data.amountUsd || 0);
        const commission = amount * 0.7;
        
        if (userId && commission > 0) {
          const existing = previousWeekEarnings.get(userId) || 0;
          previousWeekEarnings.set(userId, existing + commission);
        }
      });
      
      // Convert to array and sort by earnings
      const earners: TopEarner[] = Array.from(earningsMap.entries())
        .map(([userId, data]) => {
          const previousWeek = previousWeekEarnings.get(userId) || 0;
          let trend: 'up' | 'down' | 'neutral' = 'neutral';
          
          if (data.total > previousWeek) {
            trend = 'up';
          } else if (data.total < previousWeek) {
            trend = 'down';
          }
          
          return {
            userId,
            userName: data.userName,
            userEmail: data.userEmail,
            totalEarnings: data.total,
            trend,
            previousWeekEarnings: previousWeek
          };
        })
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, 3);
      
      setTopEarners(earners);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load top earners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏆';
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-amber-500';
      case 1: return 'from-gray-300 to-gray-400';
      case 2: return 'from-orange-400 to-orange-500';
      default: return 'from-blue-400 to-blue-500';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'neutral': return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className={`bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700/50 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-slate-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Top Earners</h3>
            <p className="text-sm text-slate-400">Last 7 Days</p>
          </div>
        </div>
        <button
          onClick={loadTopEarners}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {topEarners.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <h4 className="text-lg font-semibold text-slate-200 mb-2">No Earnings Data</h4>
          <p className="text-slate-400 text-sm">No completed orders in the last 7 days</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topEarners.map((earner, index) => (
            <div
              key={earner.userId}
              className={`group relative rounded-xl p-4 transition-all duration-300 hover:scale-105 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30' :
                index === 1 ? 'bg-gradient-to-r from-gray-500/10 to-gray-400/10 border border-gray-500/30' :
                'bg-gradient-to-r from-orange-500/10 to-orange-400/10 border border-orange-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank and Avatar */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-slate-200 font-bold text-lg shadow-lg">
                    {getInitials(earner.userName)}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-200 truncate">{earner.userName}</h4>
                    <span className="text-2xl">{getRankIcon(index)}</span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{earner.userEmail}</p>
                </div>

                {/* Earnings and Trend */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      ${earner.totalEarnings.toFixed(2)}
                    </span>
                    {earner.trend && (
                      <span className={`text-lg ${getTrendColor(earner.trend)}`}>
                        {getTrendIcon(earner.trend)}
                      </span>
                    )}
                  </div>
                  {earner.trend && earner.previousWeekEarnings !== undefined && (
                    <p className="text-xs text-slate-500">
                      {earner.trend === 'up' ? '+' : ''}
                      {((earner.totalEarnings - earner.previousWeekEarnings) / (earner.previousWeekEarnings || 1) * 100).toFixed(1)}% vs last week
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
