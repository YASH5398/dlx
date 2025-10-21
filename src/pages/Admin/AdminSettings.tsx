import React from 'react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 backdrop-blur-xl">
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Admin Settings</span>
        </h1>
        <p className="text-gray-300 text-sm mt-1">Configure global application parameters (UI ready)</p>
      </section>
      <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
        <p className="text-gray-400">This section will allow administrators to configure global application settings.</p>
        <p className="text-gray-400 mt-2">Coming soon: Manage user roles, notification templates, system-wide parameters, and integrations.</p>
      </div>
    </div>
  );
}