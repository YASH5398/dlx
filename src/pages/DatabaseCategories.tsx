import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  SparklesIcon,
  ArrowRightIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { firestore } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  priceINR?: string;
  priceUSD?: string;
  priceRange?: string;
  contactCount?: number;
  category?: string;
  createdAt?: any;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80';

export default function DatabaseCategories() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const q = query(collection(firestore, 'databaseMarketingCategories'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data: Category[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            name: v.name ?? 'Untitled',
            description: v.description ?? '',
            image: v.image ?? '',
            priceINR: v.priceINR ?? v.priceRange ?? '',
            priceUSD: v.priceUSD ?? '',
            priceRange: v.priceRange ?? '',
            contactCount: typeof v.contactCount === 'number' ? v.contactCount : undefined,
            category: v.category ?? '',
            createdAt: v.createdAt,
          };
        });
        if (!isMounted) return;
        setItems(data);
        setError(null);
      } catch (e: any) {
        console.error('[DatabaseCategories] fetch error:', e);
        if (!isMounted) return;
        setError(e?.message || 'Failed to load categories');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/database-marketing/buy-database?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Choose Your Database Category
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Select from 30+ specialized categories to find the perfect contact database for your business needs
          </p>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-12 text-gray-300">Loading categories...</div>
        )}
        {(!loading && error) && (
          <div className="text-center py-12 text-red-400">{error}</div>
        )}

        {/* Categories Grid */}
        {(!loading && !error) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {items.map((cat) => (
              <div
                key={cat.id}
                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-white/20 transition-all duration-300"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  {(cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <img src={FALLBACK_IMAGE} alt={cat.name} className="w-full h-full object-cover" />
                  ))}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-1">{cat.name}</h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{cat.description}</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="text-gray-400">Contacts</div>
                    <div className="text-white font-semibold">{typeof cat.contactCount === 'number' ? cat.contactCount.toLocaleString() : '—'}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-5">
                    <div className="text-gray-400">Price</div>
                    <div className="text-green-400 font-semibold">{cat.priceINR || cat.priceRange || '—'}{cat.priceUSD ? ` · ${cat.priceUSD}` : ''}</div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCategoryClick(cat.category || cat.id)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={() => navigate(`/database-marketing/buy-database?category=${encodeURIComponent(cat.category || cat.id)}`)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {(!loading && !error && items.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No data found</h3>
            <p className="text-gray-400">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
