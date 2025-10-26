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

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  isNew?: boolean;
  isPopular?: boolean;
  contactCount: number;
  priceRange: string;
}

const categories: Category[] = [
  {
    id: 'business',
    name: 'Business',
    description: 'Corporate contacts, decision makers, and business professionals',
    icon: '🏢',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    isPopular: true,
    contactCount: 50000,
    priceRange: '₹500-5000'
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Schools, colleges, universities, and educational institutions',
    icon: '🎓',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    contactCount: 25000,
    priceRange: '₹600-4000'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Doctors, hospitals, clinics, and healthcare professionals',
    icon: '🏥',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    isNew: true,
    contactCount: 30000,
    priceRange: '₹800-5000'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online stores, e-commerce businesses, and digital retailers',
    icon: '🛒',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    isPopular: true,
    contactCount: 40000,
    priceRange: '₹700-4500'
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Banks, financial advisors, insurance, and financial services',
    icon: '💰',
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    contactCount: 20000,
    priceRange: '₹1000-6000'
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Real estate agents, brokers, and property developers',
    icon: '🏠',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    contactCount: 15000,
    priceRange: '₹600-4000'
  },
  {
    id: 'technology',
    name: 'Technology/IT',
    description: 'Tech companies, IT professionals, and software developers',
    icon: '💻',
    color: 'blue',
    gradient: 'from-blue-600 to-indigo-600',
    isNew: true,
    contactCount: 35000,
    priceRange: '₹800-5000'
  },
  {
    id: 'startups',
    name: 'Startups',
    description: 'Startup founders, entrepreneurs, and innovative companies',
    icon: '🚀',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    isPopular: true,
    contactCount: 10000,
    priceRange: '₹500-3000'
  },
  {
    id: 'restaurants',
    name: 'Restaurants & Food',
    description: 'Restaurants, cafes, food delivery, and culinary businesses',
    icon: '🍽️',
    color: 'red',
    gradient: 'from-red-500 to-pink-500',
    contactCount: 25000,
    priceRange: '₹400-3000'
  },
  {
    id: 'travel',
    name: 'Travel & Tourism',
    description: 'Travel agencies, hotels, tour operators, and hospitality',
    icon: '✈️',
    color: 'sky',
    gradient: 'from-sky-500 to-blue-500',
    contactCount: 20000,
    priceRange: '₹600-4000'
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car dealers, mechanics, auto parts, and automotive services',
    icon: '🚗',
    color: 'gray',
    gradient: 'from-gray-500 to-slate-500',
    contactCount: 18000,
    priceRange: '₹500-3500'
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    description: 'Fashion brands, clothing stores, and apparel businesses',
    icon: '👗',
    color: 'pink',
    gradient: 'from-pink-400 to-purple-400',
    isNew: true,
    contactCount: 22000,
    priceRange: '₹600-4000'
  },
  {
    id: 'beauty',
    name: 'Beauty & Cosmetics',
    description: 'Beauty salons, cosmetics brands, and wellness centers',
    icon: '💄',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    contactCount: 15000,
    priceRange: '₹500-3500'
  },
  {
    id: 'fitness',
    name: 'Fitness & Gym',
    description: 'Gyms, fitness trainers, sports clubs, and wellness centers',
    icon: '💪',
    color: 'green',
    gradient: 'from-green-600 to-emerald-600',
    contactCount: 12000,
    priceRange: '₹400-3000'
  },
  {
    id: 'legal',
    name: 'Legal Services',
    description: 'Lawyers, law firms, legal consultants, and attorneys',
    icon: '⚖️',
    color: 'indigo',
    gradient: 'from-indigo-600 to-blue-600',
    contactCount: 8000,
    priceRange: '₹1000-6000'
  },
  {
    id: 'events',
    name: 'Event Management',
    description: 'Event planners, wedding organizers, and party services',
    icon: '🎉',
    color: 'purple',
    gradient: 'from-purple-600 to-pink-600',
    contactCount: 10000,
    priceRange: '₹600-4000'
  },
  {
    id: 'marketing',
    name: 'Marketing Agencies',
    description: 'Digital marketing, advertising agencies, and PR firms',
    icon: '📈',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    isPopular: true,
    contactCount: 15000,
    priceRange: '₹800-5000'
  },
  {
    id: 'ngo',
    name: 'NGOs / Social Causes',
    description: 'Non-profits, charities, and social impact organizations',
    icon: '🤝',
    color: 'green',
    gradient: 'from-green-500 to-teal-500',
    contactCount: 5000,
    priceRange: '₹300-2000'
  },
  {
    id: 'logistics',
    name: 'Logistics / Transport',
    description: 'Shipping, courier services, and transportation companies',
    icon: '🚚',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    contactCount: 12000,
    priceRange: '₹500-3500'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Manufacturing companies, factories, and industrial businesses',
    icon: '🏭',
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600',
    contactCount: 20000,
    priceRange: '₹700-4500'
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Farmers, agricultural suppliers, and farming businesses',
    icon: '🌾',
    color: 'green',
    gradient: 'from-green-600 to-lime-500',
    contactCount: 15000,
    priceRange: '₹400-3000'
  },
  {
    id: 'retail',
    name: 'Retail Stores',
    description: 'Physical stores, retail chains, and shopping centers',
    icon: '🏪',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-500',
    contactCount: 30000,
    priceRange: '₹500-4000'
  },
  {
    id: 'hotels',
    name: 'Hotels & Resorts',
    description: 'Hotels, resorts, hospitality, and accommodation services',
    icon: '🏨',
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    contactCount: 18000,
    priceRange: '₹600-4000'
  },
  {
    id: 'digital-services',
    name: 'Digital Services',
    description: 'Web design, digital agencies, and online service providers',
    icon: '💻',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    isNew: true,
    contactCount: 25000,
    priceRange: '₹700-4500'
  },
  {
    id: 'entertainment',
    name: 'Entertainment / Media',
    description: 'Media companies, entertainment, and content creators',
    icon: '🎬',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
    contactCount: 12000,
    priceRange: '₹600-4000'
  },
  {
    id: 'influencers',
    name: 'Influencers / Bloggers',
    description: 'Social media influencers, bloggers, and content creators',
    icon: '📱',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    isPopular: true,
    contactCount: 8000,
    priceRange: '₹500-3000'
  },
  {
    id: 'photography',
    name: 'Photography / Videography',
    description: 'Photographers, videographers, and creative professionals',
    icon: '📸',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    contactCount: 10000,
    priceRange: '₹600-4000'
  },
  {
    id: 'tutors',
    name: 'Education Tutors / Coaching',
    description: 'Private tutors, coaching centers, and educational services',
    icon: '📚',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-500',
    contactCount: 15000,
    priceRange: '₹400-3000'
  },
  {
    id: 'home-services',
    name: 'Home Services',
    description: 'Plumbers, electricians, cleaners, and home maintenance',
    icon: '🔧',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    contactCount: 20000,
    priceRange: '₹300-2500'
  },
  {
    id: 'pet-services',
    name: 'Pet Services / Veterinary',
    description: 'Veterinarians, pet stores, and animal care services',
    icon: '🐕',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    contactCount: 8000,
    priceRange: '₹500-3500'
  },
  {
    id: 'sports',
    name: 'Sports & Recreation',
    description: 'Sports clubs, recreational facilities, and fitness centers',
    icon: '⚽',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    contactCount: 10000,
    priceRange: '₹400-3000'
  },
  {
    id: 'freelancers',
    name: 'Freelancers / Consultants',
    description: 'Independent professionals, consultants, and freelancers',
    icon: '💼',
    color: 'slate',
    gradient: 'from-slate-500 to-gray-500',
    isNew: true,
    contactCount: 18000,
    priceRange: '₹600-4000'
  }
];

export default function DatabaseCategories() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredCategories = categories
    .filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedFilter === 'new') return category.isNew && matchesSearch;
      if (selectedFilter === 'popular') return category.isPopular && matchesSearch;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'contacts') return b.contactCount - a.contactCount;
      if (sortBy === 'price') return a.priceRange.localeCompare(b.priceRange);
      return 0;
    });

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/database-marketing/buy-database?category=${categoryId}`);
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

        {/* Search and Filters */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all duration-300"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-white/5 border border-white/20 rounded-2xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all duration-300"
              >
                <option value="all">All Categories</option>
                <option value="new">New & Fresh</option>
                <option value="popular">Most Popular</option>
              </select>
              <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 border border-white/20 rounded-2xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all duration-300"
              >
                <option value="name">Sort by Name</option>
                <option value="contacts">Sort by Contacts</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              <span>{filteredCategories.length} categories available</span>
            </div>
            <div className="flex items-center gap-2">
              <FireIcon className="w-4 h-4" />
              <span>Fresh 2025 data</span>
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="w-4 h-4" />
              <span>High-quality contacts</span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                hoveredCard === category.id ? 'shadow-2xl shadow-blue-500/25' : ''
              }`}
              onMouseEnter={() => setHoveredCard(category.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCategoryClick(category.id)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`} />
              
              {/* Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                {category.isNew && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                    Fresh 2025
                  </span>
                )}
                {category.isPopular && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/30">
                    Popular
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4">{category.icon}</div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* Stats */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Contacts:</span>
                    <span className="text-white font-semibold">{category.contactCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-green-400 font-semibold">{category.priceRange}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 font-semibold group-hover:text-blue-300 transition-colors duration-300">
                    View Packages
                  </span>
                  <ArrowRightIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
