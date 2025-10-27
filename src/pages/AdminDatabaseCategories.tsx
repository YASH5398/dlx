import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { firestore } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, CloudArrowUpIcon,
  XMarkIcon, CheckIcon, ExclamationTriangleIcon, SparklesIcon
} from '@heroicons/react/24/outline';

interface DatabaseCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  packages: DatabasePackage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DatabasePackage {
  id: string;
  name: string;
  contacts: number;
  price: number;
  description: string;
  fileUrl: string;
  isActive: boolean;
  createdAt: string;
}

const initialCategory: DatabaseCategory = {
  id: '',
  name: '',
  description: '',
  icon: '📊',
  packages: [],
  isActive: true,
  createdAt: '',
  updatedAt: ''
};

const initialPackage: DatabasePackage = {
  id: '',
  name: '',
  contacts: 0,
  price: 0,
  description: '',
  fileUrl: '',
  isActive: true,
  createdAt: ''
};

export default function AdminDatabaseCategories() {
  const { user } = useUser();
  const [categories, setCategories] = useState<DatabaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DatabaseCategory | null>(null);
  const [editingPackage, setEditingPackage] = useState<DatabasePackage | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoryForm, setCategoryForm] = useState<DatabaseCategory>(initialCategory);
  const [packageForm, setPackageForm] = useState<DatabasePackage>(initialPackage);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, 'database_categories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DatabaseCategory[];
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Sample data for demo
      setCategories([
        {
          id: 'cat1',
          name: 'Business',
          description: 'B2B contacts and company information',
          icon: '🏢',
          packages: [
            { id: 'pkg1', name: 'Small', contacts: 1000, price: 500, description: '1K business contacts', fileUrl: 'https://example.com/business-small.csv', isActive: true, createdAt: '2025-01-01' },
            { id: 'pkg2', name: 'Medium', contacts: 5000, price: 2000, description: '5K business contacts', fileUrl: 'https://example.com/business-medium.csv', isActive: true, createdAt: '2025-01-01' },
            { id: 'pkg3', name: 'Large', contacts: 10000, price: 5000, description: '10K business contacts', fileUrl: 'https://example.com/business-large.csv', isActive: true, createdAt: '2025-01-01' }
          ],
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        },
        {
          id: 'cat2',
          name: 'Healthcare',
          description: 'Medical professionals and healthcare facilities',
          icon: '🏥',
          packages: [
            { id: 'pkg4', name: 'Small', contacts: 1000, price: 800, description: '1K healthcare contacts', fileUrl: 'https://example.com/healthcare-small.csv', isActive: true, createdAt: '2025-01-01' },
            { id: 'pkg5', name: 'Medium', contacts: 5000, price: 3000, description: '5K healthcare contacts', fileUrl: 'https://example.com/healthcare-medium.csv', isActive: true, createdAt: '2025-01-01' }
          ],
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name || !categoryForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const categoryData = {
        ...categoryForm,
        updatedAt: new Date().toISOString(),
        createdAt: editingCategory ? editingCategory.createdAt : new Date().toISOString()
      };

      if (editingCategory) {
        await updateDoc(doc(firestore, 'database_categories', editingCategory.id), categoryData);
        setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? { ...categoryData, id: editingCategory.id } : cat));
      } else {
        const docRef = await addDoc(collection(firestore, 'database_categories'), categoryData);
        setCategories(prev => [{ ...categoryData, id: docRef.id }, ...prev]);
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm(initialCategory);
      alert('Category saved successfully!');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePackageSubmit = async () => {
    if (!packageForm.name || !packageForm.contacts || !packageForm.price || !selectedCategoryId) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const packageData = {
        ...packageForm,
        createdAt: editingPackage ? editingPackage.createdAt : new Date().toISOString()
      };

      if (editingPackage) {
        // Update package in category
        const category = categories.find(cat => cat.id === selectedCategoryId);
        if (category) {
          const updatedPackages = category.packages.map(pkg => 
            pkg.id === editingPackage.id ? packageData : pkg
          );
          await updateDoc(doc(firestore, 'database_categories', selectedCategoryId), {
            packages: updatedPackages,
            updatedAt: new Date().toISOString()
          });
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategoryId 
              ? { ...cat, packages: updatedPackages, updatedAt: new Date().toISOString() }
              : cat
          ));
        }
      } else {
        // Add new package to category
        const category = categories.find(cat => cat.id === selectedCategoryId);
        if (category) {
          const newPackage = { ...packageData, id: Date.now().toString() };
          const updatedPackages = [...category.packages, newPackage];
          await updateDoc(doc(firestore, 'database_categories', selectedCategoryId), {
            packages: updatedPackages,
            updatedAt: new Date().toISOString()
          });
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategoryId 
              ? { ...cat, packages: updatedPackages, updatedAt: new Date().toISOString() }
              : cat
          ));
        }
      }

      setShowPackageModal(false);
      setEditingPackage(null);
      setPackageForm(initialPackage);
      setSelectedCategoryId('');
      alert('Package saved successfully!');
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all packages.')) return;

    try {
      await deleteDoc(doc(firestore, 'database_categories', categoryId));
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleDeletePackage = async (categoryId: string, packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        const updatedPackages = category.packages.filter(pkg => pkg.id !== packageId);
        await updateDoc(doc(firestore, 'database_categories', categoryId), {
          packages: updatedPackages,
          updatedAt: new Date().toISOString()
        });
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, packages: updatedPackages, updatedAt: new Date().toISOString() }
            : cat
        ));
        alert('Package deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package. Please try again.');
    }
  };

  const openCategoryModal = (category?: DatabaseCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm(category);
    } else {
      setEditingCategory(null);
      setCategoryForm(initialCategory);
    }
    setShowCategoryModal(true);
  };

  const openPackageModal = (categoryId: string, packageData?: DatabasePackage) => {
    setSelectedCategoryId(categoryId);
    if (packageData) {
      setEditingPackage(packageData);
      setPackageForm(packageData);
    } else {
      setEditingPackage(null);
      setPackageForm(initialPackage);
    }
    setShowPackageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
        <p className="text-lg">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1f] via-[#0b1230] to-black text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Database Categories Management
            </h1>
            <p className="text-gray-300">Manage database categories and packages</p>
          </div>
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            Add Category
          </button>
        </div>

        <div className="grid gap-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{category.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    <p className="text-gray-300">{category.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        category.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {category.packages.length} packages
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openPackageModal(category.id)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-300"
                    title="Add Package"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openCategoryModal(category)}
                    className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors duration-300"
                    title="Edit Category"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-300"
                    title="Delete Category"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.packages.map((pkg) => (
                  <div key={pkg.id} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{pkg.name}</h4>
                        <p className="text-gray-400 text-sm">{pkg.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openPackageModal(category.id, pkg)}
                          className="p-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors duration-300"
                          title="Edit Package"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(category.id, pkg.id)}
                          className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors duration-300"
                          title="Delete Package"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Contacts:</span>
                        <span className="text-white font-semibold">{pkg.contacts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-green-400 font-semibold">₹{pkg.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`text-sm font-medium ${
                          pkg.isActive ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Business, Healthcare, Education"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Describe what this category contains..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="📊"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-gray-300">
                    Category is active
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCategorySubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Package Modal */}
        {showPackageModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#0a0e1f] to-[#0b1230] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingPackage ? 'Edit Package' : 'Add New Package'}
                </h3>
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Package Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Small, Medium, Large"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Contacts <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={packageForm.contacts}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, contacts: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Brief description of this package"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Database File URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={packageForm.fileUrl}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com/database.csv"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="packageActive"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="packageActive" className="text-gray-300">
                    Package is active
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowPackageModal(false)}
                    className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePackageSubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Package'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
