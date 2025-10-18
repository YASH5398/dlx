import React from 'react';
import Button from './Button';

type Props = {
  title: string;
  price?: string;
  description?: string;
  onGetService?: () => void;
  // onJoinAffiliate removed per design requirement
};

export default function ServiceCard({ title, price, description, onGetService }: Props) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {price && <p className="text-sm text-gray-500 mt-1">{price}</p>}
        </div>
      </div>
      {description && <p className="text-sm text-gray-700 mt-3">{description}</p>}
      <div className="mt-4 flex gap-3">
        <Button onClick={onGetService}>Get Service</Button>
        {/* Removed Join affiliate program button */}
      </div>
    </div>
  );
}