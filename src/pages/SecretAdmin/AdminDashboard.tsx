import React, { useEffect, useState } from 'react';
import { db, firestore } from '../../firebase';
import { get, ref } from 'firebase/database';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  BellIcon,
  CogIcon,
  DocumentTextIcon,
  ChartPieIcon,
  UserGroupIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ 
    users: number; 
    tickets: number; 
    orders: number; 
    revenue: number; 
    products: number; 
    referrals: number; 
    walletUsdt: number;
    activeUsers: number;
    pendingOrders: number;
    completedOrders: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState({
    users: 0,
    orders: 0,
    revenue: 0
  });

  const defaultStats = { 
    users: 0, 
    orders: 0, 
    revenue: 0, 
    tickets: 0, 
    products: 0, 
    referrals: 0, 
    walletUsdt: 0,
    activeUsers: 0,
    pendingOrders: 0,
    completedOrders: 0
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const usersSnap = await get(ref(db, 'users'));
        const usersVal = usersSnap.val() || {};
        const userIds = Object.keys(usersVal);
        const ordersCount = userIds.reduce((acc, uid) => acc + Object.keys(usersVal[uid]?.orders || {}).length, 0);
        
        setStats((prev) => ({
          ...defaultStats,
          ...(prev || {}),
          users: userIds.length,
          orders: ordersCount,
        }));
      } catch (error) {
        console.error('Failed to load admin stats from Firebase RTDB:', error);
      } finally {
        setLoading(false);
      }
    })();

    const unsubs: Array<() => void> = [];

    unsubs.push(onSnapshot(collection(firestore, 'users'), (snap: any) => {
      setStats((prev) => ({ ...defaultStats, ...(prev || {}), users: snap.size }));
    }));

    unsubs.push(onSnapshot(collection(firestore, 'products'), (snap: any) => {
      setStats((prev) => ({ ...defaultStats, ...(prev || {}), products: snap.size }));
    }));

    unsubs.push(onSnapshot(collection(firestore, 'orders'), (snap: any) => {
      const orders = snap.docs.map((doc: any) => doc.data());
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.amountUsd || 0), 0);
      const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;
      const completedOrders = orders.filter((order: any) => order.status === 'completed').length;
      
      setStats((prev) => ({ 
        ...defaultStats, 
        ...(prev || {}), 
        orders: snap.size,
        revenue: totalRevenue,
        pendingOrders,
        completedOrders
      }));
    }));

    return () => {
      unsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-2xl p-6">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'blue',
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: number; 
    color?: string;
    subtitle?: string;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-emerald-500 to-emerald-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-yellow-600'
    };

    return (
      <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-4 sm:p-6 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${
              trend > 0 ? 'text-emerald-400 bg-emerald-400/10' : trend < 0 ? 'text-red-400 bg-red-400/10' : 'text-gray-400 bg-gray-400/10'
            }`}>
              {trend > 0 ? <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4" /> : trend < 0 ? <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4" /> : null}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold text-white group-hover:text-gray-100 transition-colors">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 font-medium">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
        
        {/* Subtle animation line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-600/30 to-transparent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    );
  };

  const QuickActions = () => (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CogIcon className="w-4 h-4" />
          <span>Tools</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button className="group p-3 sm:p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-blue-300 hover:text-blue-200 transition-all duration-200 text-center hover:scale-105">
          <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs sm:text-sm font-medium">Add User</div>
        </button>
        <button className="group p-3 sm:p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-500/50 rounded-xl text-green-300 hover:text-green-200 transition-all duration-200 text-center hover:scale-105">
          <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs sm:text-sm font-medium">New Order</div>
        </button>
        <button className="group p-3 sm:p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-purple-300 hover:text-purple-200 transition-all duration-200 text-center hover:scale-105">
          <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs sm:text-sm font-medium">Analytics</div>
        </button>
        <button className="group p-3 sm:p-4 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-500/50 rounded-xl text-orange-300 hover:text-orange-200 transition-all duration-200 text-center hover:scale-105">
          <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs sm:text-sm font-medium">Alerts</div>
        </button>
      </div>
    </div>
  );

  const RecentActivity = () => (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <BellIcon className="w-4 h-4" />
          <span>Live feed</span>
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/40 transition-colors">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircleIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">New order completed</div>
            <div className="text-xs text-gray-400 truncate">Order #12345 - $299.00</div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">2m ago</div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/40 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <UsersIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">New user registered</div>
            <div className="text-xs text-gray-400 truncate">john@example.com</div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">5m ago</div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/40 transition-colors">
          <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <ExclamationTriangleIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">Service request pending</div>
            <div className="text-xs text-gray-400 truncate">Website development</div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">10m ago</div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/40 transition-colors">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <CurrencyDollarIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">Payment received</div>
            <div className="text-xs text-gray-400 truncate">$1,250.00 - USDT</div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">15m ago</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <button className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors">
          View all activity →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <header className="mb-4 sm:mb-6 md:mb-8 pt-4 sm:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent break-words">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">Real-time overview of platform metrics and activity</p>
              <div className="flex items-center gap-2 mt-2 sm:mt-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-400">Live data</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <BellIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm text-gray-300">3 alerts</span>
                </div>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <EyeIcon className="w-4 h-4 text-green-400" />
                  <span className="text-xs sm:text-sm text-gray-300">Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Users"
            value={stats?.users ?? 0}
            icon={UsersIcon}
            trend={trends.users}
            color="blue"
            subtitle="Active users"
          />
          <StatCard
            title="Total Orders"
            value={stats?.orders ?? 0}
            icon={ShoppingBagIcon}
            trend={trends.orders}
            color="green"
            subtitle={`${stats?.pendingOrders ?? 0} pending`}
          />
          <StatCard
            title="Revenue"
            value={`$${(stats?.revenue ?? 0).toLocaleString()}`}
            icon={CurrencyDollarIcon}
            trend={trends.revenue}
            color="purple"
            subtitle="Total earnings"
          />
          <StatCard
            title="Products"
            value={stats?.products ?? 0}
            icon={ChartBarIcon}
            color="orange"
            subtitle="Available items"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Active Users"
            value={stats?.activeUsers ?? 0}
            icon={ArrowTrendingUpIcon}
            color="green"
            subtitle="Last 24 hours"
          />
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders ?? 0}
            icon={ClockIcon}
            color="yellow"
            subtitle="Awaiting processing"
          />
          <StatCard
            title="Completed Orders"
            value={stats?.completedOrders ?? 0}
            icon={CheckCircleIcon}
            color="green"
            subtitle="Successfully delivered"
          />
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
        
        {/* Additional Info Section */}
        <div className="mt-8 pt-6 border-t border-gray-800/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ChartPieIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Performance</h4>
              <p className="text-xs text-gray-400">System running optimally</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Community</h4>
              <p className="text-xs text-gray-400">Growing user base</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Reports</h4>
              <p className="text-xs text-gray-400">Detailed analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}