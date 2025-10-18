import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardCard({ status='not_applied' }){
  const navigate = useNavigate();
  const label = status==='approved'?'Approved': status==='pending'?'Pending Approval':'Not Applied';
  const color = status==='approved'?'bg-emerald-600/20 text-emerald-200': status==='pending'?'bg-yellow-600/20 text-yellow-200':'bg-slate-600/20 text-slate-200';
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10 shadow-xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Affiliate Partner</h3>
          <p className="text-sm text-slate-300">Earn commissions by referring and promoting services.</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs ${color}`}>{label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={()=>navigate('/dashboard/affiliate')} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">{status==='not_applied'?'Apply Now':'View Application'}</button>
        <button onClick={()=>navigate('/dashboard/commission')} className="px-3 py-2 rounded-lg bg-white/10 text-slate-200 hover:bg-white/15">Rewards</button>
      </div>
    </div>
  );
}