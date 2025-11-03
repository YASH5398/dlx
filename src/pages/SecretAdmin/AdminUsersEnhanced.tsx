import React, { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, updateDoc, orderBy, where } from 'firebase/firestore';
import { Dialog } from '@headlessui/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { 
  Search, 
  Users, 
  Download, 
  Ban, 
  UserCheck, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Wallet,
  Crown,
  TrendingUp,
  UserPlus,
  Shield,
  DollarSign,
  Star,
  Award,
  Trophy,
  Medal
} from 'lucide-react';
import { getRankInfo, getRankDisplayName } from '../../utils/rankSystem';

// Icon mapping for rank icons
const rankIconMap: Record<string, React.ComponentType<any>> = {
  'star': Star,
  'award': Award,
  'crown': Crown,
  'shield': Shield,
  'trophy': Trophy,
  'medal': Medal
};

interface UserDoc {
  email?: string;
  name?: string;
  phone?: string;
  role?: string;
  rank?: string;
  lastLoginAt?: any;
  banned?: boolean;
  createdAt?: any;
  referralCode?: string;
  totalOrders?: number;
  totalEarnings?: number;
  activeReferrals?: number;
}

interface WalletDoc {
  dlx?: number;
  usdt?: { mainUsdt?: number; purchaseUsdt?: number };
  inr?: { mainInr?: number; purchaseInr?: number };
}

export default function AdminUsersEnhanced() {
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [wallets, setWallets] = useState<Record<string, WalletDoc>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all'|'active'|'inactive'|'banned'>('all');
  const [rankFilter, setRankFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [viewUid, setViewUid] = useState<string|null>(null);
  const [editUid, setEditUid] = useState<string|null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    rank: 'starter',
    banned: false,
    referralCode: ''
  });

  useEffect(() => {
    const uUnsub = onSnapshot(
      query(collection(firestore, 'users'), orderBy('createdAt', 'desc')), 
      (snap) => {
        const next: Record<string, UserDoc> = {};
        snap.forEach((d) => { 
          const x = d.data() as any; 
          next[d.id] = { 
            email: x.email||x.userEmail||'', 
            name: x.name||x.displayName||'', 
            phone: x.phone||x.phoneNumber||'',
            role: (x.role||x.userRole||'user').toLowerCase(),
            rank: x.rank || 'starter',
            lastLoginAt: x.lastLoginAt||x.lastActiveAt, 
            banned: !!x.banned,
            createdAt: x.createdAt,
            referralCode: x.referralCode || '',
            totalOrders: x.totalOrders || 0,
            totalEarnings: x.totalEarnings || 0,
            activeReferrals: x.activeReferrals || 0
          }; 
        });
        setUsers(next);
      }
    );
    
    const wUnsub = onSnapshot(query(collection(firestore, 'wallets')), (snap) => {
      const next: Record<string, WalletDoc> = {};
      snap.forEach((d) => { 
        const x = d.data() as any; 
        next[d.id] = { 
          dlx: Number(x.dlx||0), 
          usdt: { 
            mainUsdt: Number(x.usdt?.mainUsdt||0), 
            purchaseUsdt: Number(x.usdt?.purchaseUsdt||0) 
          },
          inr: {
            mainInr: Number(x.inr?.mainInr||0),
            purchaseInr: Number(x.inr?.purchaseInr||0)
          }
        }; 
      });
      setWallets(next);
    });
    
    return () => { 
      try{uUnsub();}catch{} 
      try{wUnsub();}catch{} 
    };
  }, []);

  const now = Date.now();
  const rows = useMemo(() => {
    const arr = Object.entries(users).map(([uid,u]) => {
      const w = wallets[uid]||{}; 
      const last = u.lastLoginAt?.toMillis ? u.lastLoginAt.toMillis() : Number(u.lastLoginAt||0);
      const active = last ? now - last < 24*60*60*1000 : false;
      return { 
        uid, 
        name: u.name||u.email||'User', 
        email: u.email||'', 
        phone: u.phone||'',
        role: u.role||'user',
        rank: u.rank || 'starter',
        active, 
        banned: !!u.banned, 
        dlx: Number(w.dlx||0), 
        mainUsdt: Number(w.usdt?.mainUsdt||0), 
        purchaseUsdt: Number(w.usdt?.purchaseUsdt||0),
        mainInr: Number(w.inr?.mainInr||0),
        purchaseInr: Number(w.inr?.purchaseInr||0),
        referralCode: u.referralCode || '',
        totalOrders: u.totalOrders || 0,
        totalEarnings: u.totalEarnings || 0,
        activeReferrals: u.activeReferrals || 0,
        createdAt: u.createdAt
      };
    });
    
    const q = search.trim().toLowerCase();
    let f = arr.filter(r => 
      !q || 
      r.name.toLowerCase().includes(q) || 
      r.email.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.referralCode.toLowerCase().includes(q)
    );
    
    if (status==='active') f = f.filter(r => r.active && !r.banned);
    if (status==='inactive') f = f.filter(r => !r.active && !r.banned);
    if (status==='banned') f = f.filter(r => r.banned);
    
    if (rankFilter !== 'all') {
      f = f.filter(r => r.rank === rankFilter);
    }
    
    return f.sort((a,b) => a.name.localeCompare(b.name));
  }, [users, wallets, search, status, rankFilter, now]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

  const toggleBan = async (uid: string, banned: boolean) => {
    try { 
      await updateDoc(doc(firestore, 'users', uid), { 
        banned: !banned, 
        bannedAt: !banned ? Date.now() : null 
      }); 
    }
    catch (e) { 
      console.error(e); 
      alert('Failed to update user'); 
    }
  };

  const startEdit = (user: any) => {
    setEditUid(user.uid);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      rank: user.rank,
      banned: user.banned,
      referralCode: user.referralCode
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editUid) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(doc(firestore, 'users', editUid), {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        rank: editForm.rank,
        banned: editForm.banned,
        referralCode: editForm.referralCode,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      setIsEditing(false);
      setEditUid(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditUid(null);
  };

  const exportCsv = () => {
    const header = ['Name','Email','Phone','Rank','Status','DLX','USDT','Orders','Referrals','Created'];
    const lines = rows.map(r => [
      r.name, 
      r.email, 
      r.phone,
      r.rank,
      r.banned?'banned':(r.active?'active':'inactive'), 
      r.dlx.toFixed(2), 
      (r.mainUsdt + r.purchaseUsdt).toFixed(2),
      r.totalOrders,
      r.activeReferrals,
      r.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
    ].join(','));
    
    const blob = new Blob([[header.join(',')].concat(lines).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href=url; 
    a.download='users.csv'; 
    a.click(); 
    URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const totalUsers = rows.length;
    const activeUsers = rows.filter(r => r.active && !r.banned).length;
    const bannedUsers = rows.filter(r => r.banned).length;
    const totalDLX = rows.reduce((sum, r) => sum + r.dlx, 0);
    const totalUSDT = rows.reduce((sum, r) => sum + r.mainUsdt + r.purchaseUsdt, 0);
    
    return { totalUsers, activeUsers, bannedUsers, totalDLX, totalUSDT };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              User Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Manage user accounts, ranks, and permissions
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Live updates</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6 lg:mt-0">
            <Button onClick={exportCsv} variant="outline" className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsers}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activeUsers}</div>
                  <div className="text-sm text-green-600 dark:text-green-300">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.bannedUsers}</div>
                  <div className="text-sm text-red-600 dark:text-red-300">Banned</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalDLX.toFixed(0)}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-300">Total DLX</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">${stats.totalUSDT.toFixed(0)}</div>
                  <div className="text-sm text-orange-600 dark:text-orange-300">Total USDT</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    placeholder="Search by name, email, phone, or referral code..."
                    className="pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>
              </div>
              <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value as any); }}>
                <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rankFilter} onValueChange={(value) => { setPage(1); setRankFilter(value); }}>
                <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Filter by rank" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Ranks</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="dlx-associate">DLX Associate</SelectItem>
                  <SelectItem value="dlx-executive">DLX Executive</SelectItem>
                  <SelectItem value="dlx-director">DLX Director</SelectItem>
                  <SelectItem value="dlx-president">DLX President</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({pageRows.length})
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Manage user accounts, ranks, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-700 dark:text-slate-300">User</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Contact</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Rank</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Wallet</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300">Stats</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => {
                    const rankInfo = getRankInfo(r.rank);
                    return (
                      <TableRow key={r.uid} className={`border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${r.banned ? 'opacity-60' : ''}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{r.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">ID: {r.uid.slice(0, 8)}...</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600 dark:text-slate-300">{r.email}</span>
                            </div>
                            {r.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-300">{r.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {React.createElement(rankIconMap[rankInfo.icon] || Star, { className: `w-4 h-4 ${rankInfo.textColor}` })}
                            <Badge variant="outline" className={`${rankInfo.borderColor} ${rankInfo.textColor}`}>
                              {rankInfo.name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant={r.active ? "default" : "secondary"}>
                              {r.active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-medium">DLX:</span> {r.dlx.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-medium">USDT:</span> ${(r.mainUsdt + r.purchaseUsdt).toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-medium">Orders:</span> {r.totalOrders}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-medium">Referrals:</span> {r.activeReferrals}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewUid(r.uid)}
                              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(r)}
                              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            {r.banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleBan(r.uid, true)}
                                className="bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => toggleBan(r.uid, false)}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Ban
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                        No users match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {pageRows.map((r) => {
                const rankInfo = getRankInfo(r.rank);
                return (
                  <Card key={r.uid} className={`bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${r.banned ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{r.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{r.email}</div>
                          {r.phone && (
                            <div className="text-sm text-slate-500 dark:text-slate-400">{r.phone}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            {React.createElement(rankIconMap[rankInfo.icon] || Star, { className: `w-4 h-4 ${rankInfo.textColor}` })}
                            <Badge variant="outline" className={`${rankInfo.borderColor} ${rankInfo.textColor} text-xs`}>
                              {rankInfo.name}
                            </Badge>
                          </div>
                          <div>
                            {r.banned ? (
                              <Badge variant="destructive" className="text-xs">Banned</Badge>
                            ) : (
                              <Badge variant={r.active ? "default" : "secondary"} className="text-xs">
                                {r.active ? 'Active' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 dark:text-slate-300 mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>DLX: {r.dlx.toFixed(2)}</span>
                          <span>USDT: ${(r.mainUsdt + r.purchaseUsdt).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orders: {r.totalOrders}</span>
                          <span>Referrals: {r.activeReferrals}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewUid(r.uid)}
                          className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(r)}
                          className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages} • {rows.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Details Modal */}
        <Dialog open={!!viewUid} onClose={() => setViewUid(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Panel className="mx-auto w-full max-w-[95vw] sm:max-w-2xl rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 backdrop-blur-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              {viewUid && (
                <>
                  <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-white mb-4">User Profile</Dialog.Title>
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Name:</span>
                        <div className="text-slate-900 dark:text-white font-medium">{users[viewUid]?.name || users[viewUid]?.email}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Email:</span>
                        <div className="text-slate-900 dark:text-white font-medium">{users[viewUid]?.email}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                        <div className="text-slate-900 dark:text-white font-medium">{users[viewUid]?.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Rank:</span>
                        <div className="text-slate-900 dark:text-white font-medium">{getRankDisplayName(users[viewUid]?.rank || 'starter')}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">DLX Balance:</span>
                          <div className="text-slate-900 dark:text-white font-medium">{Number(wallets[viewUid]?.dlx || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">USDT Balance:</span>
                          <div className="text-slate-900 dark:text-white font-medium">${Number(wallets[viewUid]?.usdt?.mainUsdt || 0) + Number(wallets[viewUid]?.usdt?.purchaseUsdt || 0)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Total Orders:</span>
                          <div className="text-slate-900 dark:text-white font-medium">{users[viewUid]?.totalOrders || 0}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Active Referrals:</span>
                          <div className="text-slate-900 dark:text-white font-medium">{users[viewUid]?.activeReferrals || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setViewUid(null)}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={isEditing} onClose={cancelEdit} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Panel className="mx-auto w-full max-w-[95vw] sm:max-w-2xl rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 backdrop-blur-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Edit User</Dialog.Title>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Email</label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Phone</label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Rank</label>
                    <Select value={editForm.rank} onValueChange={(value) => setEditForm({...editForm, rank: value})}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="dlx-associate">DLX Associate</SelectItem>
                        <SelectItem value="dlx-executive">DLX Executive</SelectItem>
                        <SelectItem value="dlx-director">DLX Director</SelectItem>
                        <SelectItem value="dlx-president">DLX President</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Referral Code</label>
                    <Input
                      value={editForm.referralCode}
                      onChange={(e) => setEditForm({...editForm, referralCode: e.target.value})}
                      className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="banned"
                      checked={editForm.banned}
                      onChange={(e) => setEditForm({...editForm, banned: e.target.checked})}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    <label htmlFor="banned" className="text-sm font-medium text-slate-700 dark:text-slate-300">Banned</label>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEdit}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
