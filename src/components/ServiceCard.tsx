import React from 'react';
import Button from './Button';

type Props = {
  title: string;
  price?: string;
  description?: string;
  features?: string[];
  onGetService?: () => void;
  // onJoinAffiliate removed per design requirement
};

export default function ServiceCard({ title, price, description, features, onGetService }: Props) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {price && <p className="text-sm text-gray-500 mt-1">{price}</p>}
        </div>
      </div>
      {description && <p className="text-sm text-gray-700 mt-3">{description}</p>}
      {Array.isArray(features) && features.length > 0 && (
        <ul className="mt-3 list-disc list-inside text-sm text-gray-700">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-3">
        <Button onClick={onGetService}>Get Service</Button>
        {/* Removed Join affiliate program button */}
      </div>
    </div>
  );
}