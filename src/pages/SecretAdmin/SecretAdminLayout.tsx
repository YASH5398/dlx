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
  ChevronDownIcon
} from '@heroicons/react/24/outline';

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
        `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
        }`
      }
      onClick={() => setMobileOpen(false)}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
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
          className={`w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
            isMainActive || isSubmenuActive
              ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
          }`}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          {badge && badge > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {badge}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {submenu.map((subItem) => (
              <NavLink
                key={subItem.to}
                to={subItem.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                <subItem.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{subItem.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  const navItems = [
    { to: '/secret-admin', label: 'Dashboard', icon: HomeIcon },
    { to: '/secret-admin/users', label: 'Users', icon: UsersIcon, badge: 0 },
    { to: '/secret-admin/user-ranks', label: 'User Ranks', icon: UserGroupIcon },
    { to: '/secret-admin/orders', label: 'Orders', icon: ShoppingBagIcon, badge: 0 },
    { to: '/secret-admin/support-requests', label: 'Support Requests', icon: ChatBubbleLeftRightIcon, badge: 0 },
    { to: '/secret-admin/service-requests', label: 'Service Requests', icon: WrenchScrewdriverIcon, badge: 3 },
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
    { to: '/secret-admin/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <AdminSocketProvider>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} text-white flex`}>
      {/* Sidebar (desktop) */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 bg-gradient-to-b from-gray-900 to-gray-850 border-r border-gray-800/50 hidden md:flex md:flex-col shadow-xl transition-all duration-300`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-800/50">
          <Link to="/secret-admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-extrabold tracking-tight text-emerald-400">
                DLX Admin
              </span>
            )}
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
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
                <Dialog.Panel className="w-80 max-w-full h-screen bg-gradient-to-b from-gray-900 to-gray-850 border-r border-gray-800/50 shadow-xl">
                  <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800/50">
                    <Link to="/secret-admin" className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-extrabold tracking-tight text-emerald-400">
                        DLX Admin
                      </span>
                    </Link>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-300" />
                    </button>
                  </div>
                  
                  <nav className="mt-4 px-4 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
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
                  
                  <div className="px-6 py-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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