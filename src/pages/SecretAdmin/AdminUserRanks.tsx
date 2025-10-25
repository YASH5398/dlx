import React, { useEffect, useState, useMemo } from 'react';
import { firestore } from '../../firebase';
import { collection, doc, onSnapshot, query, updateDoc, orderBy } from 'firebase/firestore';
import { Dialog } from '@headlessui/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Users, Crown, Star, Award, Trophy, Medal, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

// Rank definitions with commission percentages
export const RANK_DEFINITIONS = {
  'starter': {
    name: 'Starter',
    color: 'bg-green-500',
    textColor: 'text-green-300',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-600/20',
    commission: 0,
    icon: Star,
    description: 'Entry level rank with 0% commission'
  },
  'dlx-associate': {
    name: 'DLX Associate',
    color: 'bg-blue-500',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-600/20',
    commission: 25,
    icon: Award,
    description: 'Associate level with 25% commission'
  },
  'dlx-executive': {
    name: 'DLX Executive',
    color: 'bg-purple-500',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-600/20',
    commission: 30,
    icon: Crown,
    description: 'Executive level with 30% commission'
  },
  'dlx-director': {
    name: 'DLX Director',
    color: 'bg-orange-500',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-600/20',
    commission: 35,
    icon: Trophy,
    description: 'Director level with 35% commission'
  },
  'dlx-president': {
    name: 'DLX President',
    color: 'bg-red-500',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-600/20',
    commission: 45,
    icon: Medal,
    description: 'President level with 45% commission'
  }
};

export default function AdminUserRanks() {
  type UserDoc = { 
    email?: string; 
    name?: string; 
    role?: string; 
    rank?: string;
    lastLoginAt?: any; 
    banned?: boolean;
    createdAt?: any;
  };
  type WalletDoc = { 
    dlx?: number; 
    usdt?: { mainUsdt?: number; purchaseUsdt?: number } 
  };

  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [wallets, setWallets] = useState<Record<string, WalletDoc>>({});
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [viewUid, setViewUid] = useState<string|null>(null);
  const [selectedRank, setSelectedRank] = useState<string>('starter');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const uUnsub = onSnapshot(query(collection(firestore, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      const next: Record<string, UserDoc> = {};
      snap.forEach((d) => { 
        const x = d.data() as any; 
        next[d.id] = { 
          email: x.email||x.userEmail||'', 
          name: x.name||x.displayName||'', 
          role: (x.role||x.userRole||'user').toLowerCase(), 
          rank: x.rank || 'starter',
          lastLoginAt: x.lastLoginAt||x.lastActiveAt, 
          banned: !!x.banned,
          createdAt: x.createdAt
        }; 
      });
      setUsers(next);
    });
    const wUnsub = onSnapshot(query(collection(firestore, 'wallets')), (snap) => {
      const next: Record<string, WalletDoc> = {};
      snap.forEach((d) => { 
        const x = d.data() as any; 
        next[d.id] = { 
          dlx: Number(x.dlx||0), 
          usdt: { 
            mainUsdt: Number(x.usdt?.mainUsdt||0), 
            purchaseUsdt: Number(x.usdt?.purchaseUsdt||0) 
          } 
        }; 
      });
      setWallets(next);
    });
    return () => { try{uUnsub();}catch{} try{wUnsub();}catch{} };
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
        role: u.role||'user', 
        rank: u.rank || 'starter',
        active, 
        banned: !!u.banned, 
        dlx: Number(w.dlx||0), 
        mainUsdt: Number(w.usdt?.mainUsdt||0), 
        purchaseUsdt: Number(w.usdt?.purchaseUsdt||0) 
      };
    });
    const q = search.trim().toLowerCase();
    let f = arr.filter(r => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    if (rankFilter !== 'all') {
      f = f.filter(r => r.rank === rankFilter);
    }
    return f.sort((a,b) => {
      // Sort by rank priority, then by name
      const rankOrder = ['dlx-president', 'dlx-director', 'dlx-executive', 'dlx-associate', 'starter'];
      const aRankIndex = rankOrder.indexOf(a.rank);
      const bRankIndex = rankOrder.indexOf(b.rank);
      if (aRankIndex !== bRankIndex) {
        return aRankIndex - bRankIndex;
      }
      return a.name.localeCompare(b.name);
    });
  }, [users, wallets, search, rankFilter, now]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

  const updateUserRank = async (uid: string, newRank: string) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(firestore, 'users', uid), { 
        rank: newRank,
        rankUpdatedAt: new Date(),
        rankUpdatedBy: 'admin'
      });
      setViewUid(null);
    } catch (e) { 
      console.error(e); 
      alert('Failed to update user rank'); 
    } finally {
      setIsUpdating(false);
    }
  };

  const getRankStats = () => {
    const stats = {
      starter: 0,
      'dlx-associate': 0,
      'dlx-executive': 0,
      'dlx-director': 0,
      'dlx-president': 0
    };
    
    Object.values(users).forEach(user => {
      const rank = user.rank || 'starter';
      if (stats.hasOwnProperty(rank)) {
        stats[rank as keyof typeof stats]++;
      }
    });
    
    return stats;
  };

  const rankStats = getRankStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              User Rank Management
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage user ranks and commission structures</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates</span>
            </div>
          </div>
        </div>

        {/* Rank Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {Object.entries(RANK_DEFINITIONS).map(([key, rank]) => (
            <Card key={key} className={`${rank.bgColor} ${rank.borderColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <rank.icon className={`w-5 h-5 ${rank.textColor}`} />
                  <div className="text-sm font-medium text-white">{rank.name}</div>
                </div>
                <div className="text-2xl font-bold text-white">{rankStats[key as keyof typeof rankStats]}</div>
                <div className="text-xs text-gray-300">{rank.commission}% commission</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    placeholder="Search by name or email..."
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <Select value={rankFilter} onValueChange={(value) => { setPage(1); setRankFilter(value); }}>
                <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by rank" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Ranks</SelectItem>
                  {Object.entries(RANK_DEFINITIONS).map(([key, rank]) => (
                    <SelectItem key={key} value={key}>{rank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({pageRows.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage user ranks and commission structures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700/50">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Current Rank</TableHead>
                    <TableHead className="text-gray-300">Commission</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">DLX</TableHead>
                    <TableHead className="text-gray-300">Main USDT</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r: any) => {
                    const rankInfo = RANK_DEFINITIONS[r.rank as keyof typeof RANK_DEFINITIONS] || RANK_DEFINITIONS.starter;
                    return (
                      <TableRow key={r.uid} className={`border-gray-700/50 hover:bg-white/5 ${r.banned ? 'opacity-60' : ''}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{r.name}</div>
                            <div className="text-sm text-gray-400">{r.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <rankInfo.icon className={`w-4 h-4 ${rankInfo.textColor}`} />
                            <Badge variant="outline" className={`${rankInfo.borderColor} ${rankInfo.textColor}`}>
                              {rankInfo.name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-white font-medium">{rankInfo.commission}%</div>
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
                        <TableCell className="text-white">{r.dlx.toFixed(2)}</TableCell>
                        <TableCell className="text-white">${r.mainUsdt.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewUid(r.uid)}
                              className="bg-white/10 border-white/20 hover:bg-white/20"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        No users match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {pageRows.map((r: any) => {
                const rankInfo = RANK_DEFINITIONS[r.rank as keyof typeof RANK_DEFINITIONS] || RANK_DEFINITIONS.starter;
                return (
                  <Card key={r.uid} className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 ${r.banned ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-white">{r.name}</div>
                          <div className="text-sm text-gray-400">{r.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <rankInfo.icon className={`w-4 h-4 ${rankInfo.textColor}`} />
                            <Badge variant="outline" className={`${rankInfo.borderColor} ${rankInfo.textColor} text-xs`}>
                              {rankInfo.name}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300">{rankInfo.commission}% commission</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-4">
                        <div className="flex justify-between">
                          <span>DLX: {r.dlx.toFixed(2)}</span>
                          <span>Main: ${r.mainUsdt.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewUid(r.uid)}
                          className="flex-1 bg-white/10 border-white/20 hover:bg-white/20"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Manage Rank
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
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {page} of {totalPages} • {rows.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rank Management Modal */}
        <Dialog open={!!viewUid} onClose={() => setViewUid(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-xl p-6">
              {viewUid && (
                <>
                  <Dialog.Title className="text-xl font-semibold text-white mb-4">Manage User Rank</Dialog.Title>
                  <div className="space-y-4">
                    <div className="text-sm">
                      <div className="text-gray-400 mb-2">User Details:</div>
                      <div className="text-white font-medium">{users[viewUid]?.name || users[viewUid]?.email}</div>
                      <div className="text-gray-300 text-sm">{users[viewUid]?.email}</div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="text-gray-400 mb-2">Current Rank:</div>
                      {(() => {
                        const currentRank = users[viewUid]?.rank || 'starter';
                        const rankInfo = RANK_DEFINITIONS[currentRank as keyof typeof RANK_DEFINITIONS] || RANK_DEFINITIONS.starter;
                        return (
                          <div className="flex items-center gap-2">
                            <rankInfo.icon className={`w-4 h-4 ${rankInfo.textColor}`} />
                            <Badge variant="outline" className={`${rankInfo.borderColor} ${rankInfo.textColor}`}>
                              {rankInfo.name} ({rankInfo.commission}%)
                            </Badge>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Select New Rank:</label>
                      <Select value={selectedRank} onValueChange={setSelectedRank}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {Object.entries(RANK_DEFINITIONS).map(([key, rank]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <rank.icon className={`w-4 h-4 ${rank.textColor}`} />
                                <span>{rank.name} ({rank.commission}%)</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRank !== (users[viewUid]?.rank || 'starter') && (
                      <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                        <div className="text-sm text-blue-200">
                          This will change the user's commission rate from{' '}
                          {RANK_DEFINITIONS[users[viewUid]?.rank as keyof typeof RANK_DEFINITIONS]?.commission || 0}% to{' '}
                          {RANK_DEFINITIONS[selectedRank as keyof typeof RANK_DEFINITIONS]?.commission}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setViewUid(null)}
                      className="bg-white/10 border-white/20 hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => updateUserRank(viewUid, selectedRank)}
                      disabled={isUpdating || selectedRank === (users[viewUid]?.rank || 'starter')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUpdating ? 'Updating...' : 'Update Rank'}
                    </Button>
                  </div>
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
