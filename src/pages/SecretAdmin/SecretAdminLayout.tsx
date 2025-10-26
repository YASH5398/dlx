import React, { Fragment, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth, firestore } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { AdminSocketProvider } from '../../context/AdminSocketContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  WrenchScrewdriverIcon, 
  CubeIcon, 
  CreditCardIcon, 
  ShareIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  BellIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { Package } from 'lucide-react';

export default function SecretAdminLayout() {
  const [admin, setAdmin] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAdmin(null);
        navigate('/secret-admin/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(firestore, 'users', u.uid));
        const data = (userDoc.data() as any) || {};
        const role = (data.role || data.userRole || '').toLowerCase();
        if (!userDoc.exists() || role !== 'admin') {
          setAdmin(null);
          navigate('/secret-admin/login');
          return;
        }
        setAdmin({ id: u.uid, email: u.email || '', name: u.displayName || undefined });
      } catch {
        setAdmin(null);
        navigate('/secret-admin/login');
      }
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, [navigate]);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      try { localStorage.removeItem('isAdmin'); } catch {}
      navigate('/secret-admin/login');
    }
  };

  const MenuItem = ({ to, label, icon: Icon, badge }: { to: string; label: string; icon: any; badge?: number }) => (
    <NavLink
      key={to}
      to={to}
      end
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20'
            : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50 hover:text-white hover:shadow-md hover:scale-105'
        }`
      }
      onClick={() => setMobileOpen(false)}
    >
      <div className={`p-2 rounded-lg transition-all duration-300 ${
        'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 group-hover:from-emerald-500/30 group-hover:to-blue-500/30'
      }`}>
        <Icon className="w-5 h-5 flex-shrink-0 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
      </div>
      <span className="flex-1 group-hover:text-white transition-colors duration-300">{label}</span>
      {badge && badge > 0 && (
        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center shadow-lg shadow-red-500/25 animate-pulse">
          {badge}
        </span>
      )}
      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </NavLink>
  );

  const MenuItemWithSubmenu = ({ to, label, icon: Icon, badge, submenu, collapsed }: { 
    to: string; 
    label: string; 
    icon: any; 
    badge?: number;
    submenu: Array<{ to: string; label: string; icon: any }>;
    collapsed: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Check if any submenu item is active
    const isSubmenuActive = submenu.some(item => location.pathname === item.to);
    const isMainActive = location.pathname === to;

    if (collapsed) {
      return (
        <NavLink
          to={to}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              isActive || isSubmenuActive
                ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
            }`
          }
          onClick={() => setMobileOpen(false)}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {badge && badge > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {badge}
            </span>
          )}
        </NavLink>
      );
    }

    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
            isMainActive || isSubmenuActive
              ? 'bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20'
              : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50 hover:text-white hover:shadow-md hover:scale-105'
          }`}
        >
          <div className={`p-2 rounded-lg transition-all duration-300 ${
            'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 group-hover:from-emerald-500/30 group-hover:to-blue-500/30'
          }`}>
            <Icon className="w-5 h-5 flex-shrink-0 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
          </div>
          <span className="flex-1 text-left group-hover:text-white transition-colors duration-300">{label}</span>
          {badge && badge > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center shadow-lg shadow-red-500/25 animate-pulse">
              {badge}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-gray-400 group-hover:text-white`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {/* Hover effect overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
        <div className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="ml-4 mt-1 space-y-1">
            {submenu.map((subItem) => (
              <NavLink
                key={subItem.to}
                to={subItem.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50 hover:scale-105'
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                  'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 group-hover:from-emerald-500/20 group-hover:to-blue-500/20'
                }`}>
                  <subItem.icon className="w-4 h-4 flex-shrink-0 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                </div>
                <span className="flex-1 group-hover:text-white transition-colors duration-300">{subItem.label}</span>
                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const navItems = [
    { to: '/secret-admin', label: 'Dashboard', icon: HomeIcon },
    { to: '/secret-admin/users', label: 'Users', icon: UsersIcon, badge: 0 },
    { to: '/secret-admin/user-ranks', label: 'User Ranks', icon: UserGroupIcon },
    { to: '/secret-admin/orders', label: 'Orders', icon: ShoppingBagIcon, badge: 0 },
    { to: '/secret-admin/support-requests', label: 'Support Requests', icon: ChatBubbleLeftRightIcon, badge: 0 },
    { 
      to: '/secret-admin/service-requests', 
      label: 'Service Requests', 
      icon: WrenchScrewdriverIcon, 
      badge: 3,
      submenu: [
        { to: '/secret-admin/service-requests', label: 'All Requests', icon: WrenchScrewdriverIcon },
        { to: '/secret-admin/service-requests/manage', label: 'Service Manage', icon: Package }
      ]
    },
    { to: '/secret-admin/products', label: 'Products', icon: CubeIcon },
    { 
      to: '/secret-admin/transactions', 
      label: 'Transactions', 
      icon: CreditCardIcon,
      submenu: [
        { to: '/secret-admin/transactions/deposit-requests', label: 'Deposit Requests', icon: CreditCardIcon },
        { to: '/secret-admin/transactions/withdrawal-requests', label: 'Withdrawal Requests', icon: CreditCardIcon }
      ]
    },
    { to: '/secret-admin/referrals', label: 'Referrals', icon: ShareIcon },
    { to: '/secret-admin/affiliates', label: 'Affiliates', icon: UserGroupIcon },
    { to: '/secret-admin/notifications', label: 'Notifications', icon: BellIcon, badge: 5 },
    { to: '/secret-admin/dlx-listing', label: 'DLX Listing', icon: RocketLaunchIcon },
    { to: '/secret-admin/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <AdminSocketProvider>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} text-white flex`}>
      {/* Enhanced Sidebar (desktop) */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 hidden md:flex md:flex-col shadow-2xl transition-all duration-300 backdrop-blur-xl`}>
        <div className="h-20 flex items-center px-6 border-b border-gray-700/50 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
          <Link to="/secret-admin" className="flex items-center gap-3 group relative z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-110 transition-all duration-500">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all duration-500">
                DLX Admin
              </span>
            )}
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
          {navItems.map((item) => (
            item.submenu ? (
              <MenuItemWithSubmenu 
                key={item.to} 
                to={item.to} 
                label={item.label} 
                icon={item.icon}
                badge={item.badge}
                submenu={item.submenu}
                collapsed={sidebarCollapsed}
              />
            ) : (
              <MenuItem 
                key={item.to} 
                to={item.to} 
                label={item.label} 
                icon={item.icon}
                badge={item.badge}
              />
            )
          ))}
        </nav>
        
        {/* Enhanced Footer with Settings and Help */}
        <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-300 group">
              <div className="p-2 rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-500/20 group-hover:from-gray-500/30 group-hover:to-gray-400/30 transition-all duration-300">
                <Cog6ToothIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-300" />
              </div>
              <span className="flex-1 text-left group-hover:text-white transition-colors duration-300">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-300 group">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-500/20 group-hover:from-blue-500/30 group-hover:to-blue-400/30 transition-all duration-300">
                <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="flex-1 text-left group-hover:text-white transition-colors duration-300">Help & Support</span>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {admin?.name?.charAt(0) || admin?.email?.charAt(0) || 'A'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {admin?.name || 'Admin'}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {admin?.email}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Transition appear show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={() => setMobileOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-start">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 -translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-full"
              >
                <Dialog.Panel className="w-80 max-w-full h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 shadow-2xl backdrop-blur-xl">
                  <div className="h-20 flex items-center justify-between px-6 border-b border-gray-700/50 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
                    <Link to="/secret-admin" className="flex items-center gap-3 relative z-10 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-110 transition-all duration-500">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all duration-500">
                        DLX Admin
                      </span>
                    </Link>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-gray-700/70 hover:to-gray-600/70 hover:scale-110 transition-all duration-300 relative z-10"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-300 hover:text-white transition-colors duration-300" />
                    </button>
                  </div>
                  
                  <nav className="mt-4 px-4 space-y-2 overflow-y-auto h-[calc(100vh-12rem)] scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                    {navItems.map((item) => (
                      item.submenu ? (
                        <MenuItemWithSubmenu 
                          key={item.to} 
                          to={item.to} 
                          label={item.label} 
                          icon={item.icon}
                          badge={item.badge}
                          submenu={item.submenu}
                          collapsed={false}
                        />
                      ) : (
                        <MenuItem 
                          key={item.to} 
                          to={item.to} 
                          label={item.label} 
                          icon={item.icon}
                          badge={item.badge}
                        />
                      )
                    ))}
                  </nav>
                  
                  {/* Enhanced Footer with Settings and Help */}
                  <div className="px-4 py-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
                    <div className="space-y-2 mb-4">
                      <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-300 group">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-gray-600/20 to-gray-500/20 group-hover:from-gray-500/30 group-hover:to-gray-400/30 transition-all duration-300">
                          <Cog6ToothIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-300" />
                        </div>
                        <span className="flex-1 text-left group-hover:text-white transition-colors duration-300">Settings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-300 group">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-500/20 group-hover:from-blue-500/30 group-hover:to-blue-400/30 transition-all duration-300">
                          <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="flex-1 text-left group-hover:text-white transition-colors duration-300">Help & Support</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-sm font-semibold text-white">
                          {admin?.name?.charAt(0) || admin?.email?.charAt(0) || 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate">
                          {admin?.name || 'Admin'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {admin?.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 text-red-300 rounded-xl hover:bg-red-500/30 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                    >
                      Logout
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-gray-900 to-gray-850 border-b border-gray-800/50 flex items-center justify-between px-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Bars3Icon className="w-5 h-5 text-gray-300" />
            </button>
            
            <button
              className="hidden md:inline-flex items-center justify-center rounded-lg p-2 bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Bars3Icon className="w-5 h-5 text-gray-300" />
            </button>
            
            <div className="text-lg font-semibold text-gray-200">Admin Panel</div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200">
              <BellIcon className="w-5 h-5 text-gray-300" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200"
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-300" />
              )}
            </button>
            
            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-200 truncate max-w-xs">
                  {admin?.name || 'Admin'}
                </div>
                <div className="text-xs text-gray-400 truncate max-w-xs">
                  {admin?.email}
                </div>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-700 text-white text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <span className="hidden sm:inline">Logout</span>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </AdminSocketProvider>
  );
}