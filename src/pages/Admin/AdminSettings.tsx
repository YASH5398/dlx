import React from 'react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
        <p className="text-gray-400">This section will allow administrators to configure global application settings.</p>
        <p className="text-gray-400 mt-2">Coming soon: Features to manage user roles, notification templates, system-wide parameters, and integrations.</p>
      </div>
    </div>
  );
}