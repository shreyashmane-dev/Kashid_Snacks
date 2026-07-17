import React, { useState, useEffect } from 'react';
import { PRODUCTS, CATEGORIES } from '../../utils/mockData';
import { Plus, Edit2, Trash2, X, Search, Image as ImageIcon, Upload } from 'lucide-react';
import { uploadToCloudinary } from '../../config/cloudinary';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseMock } from '../../config/firebase';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('namkeen');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [variants, setVariants] = useState([{ weight: '250g', price: 150, stock: 50 }]);
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (isFirebaseMock) {
      const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
      setProducts(dbProducts.length > 0 ? dbProducts : PRODUCTS);
    } else {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push(doc.data());
        });
        
        if (list.length === 0) {
          // Firestore is empty, auto-seed default products so they can be edited/deleted
          for (const prod of PRODUCTS) {
            await setDoc(doc(db, 'products', prod.id), prod);
          }
          setProducts(PRODUCTS);
        } else {
          setProducts(list);
        }
      } catch (error) {
        console.error("Error loading products from firestore:", error);
      }
    }
  };

  const handleOpenModal = (prod = null) => {
    setError('');
    if (prod) {
      setEditingProduct(prod);
      setName(prod.name);
      setCategory(prod.category);
      setDescription(prod.description);
      setImageUrl(prod.images?.[0] || '');
      setVariants(prod.variants || [{ weight: '250g', price: 150, stock: 50 }]);
    } else {
      setEditingProduct(null);
      setName('');
      setCategory('namkeen');
      setDescription('');
      setImageUrl('');
      setVariants([{ weight: '250g', price: 150, stock: 50 }]);
    }
    setIsOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError('');
      setUploading(true);
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
    } catch (err) {
      setError("Failed to upload image. Verify preset configuration.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { weight: '100g', price: 100, stock: 20 }]);
  };

  const handleRemoveVariant = (idx) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx, field, value) => {
    const updated = [...variants];
    updated[idx] = { 
      ...updated[idx], 
      [field]: field === 'weight' ? value : Number(value) 
    };
    setVariants(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !description || !imageUrl) {
      return setError("Please fill in name, description and upload an image.");
    }

    try {
      setError('');
      setSubmitting(true);

      const prodId = editingProduct ? editingProduct.id : `snack-${Date.now()}`;
      const otherImages = editingProduct?.images?.slice(1) || [];
      const newProduct = {
        id: prodId,
        name,
        category,
        description,
        price: variants[0]?.price || 150,
        weight: variants[0]?.weight || '250g',
        stock: variants.reduce((sum, v) => sum + v.stock, 0),
        images: [imageUrl, ...otherImages],
        variants,
        rating: editingProduct?.rating || 5.0,
        reviewsCount: editingProduct?.reviewsCount || 1,
        reviews: editingProduct?.reviews || []
      };

      if (isFirebaseMock) {
        const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
        let updatedList = [];
        if (editingProduct) {
          updatedList = dbProducts.map(p => p.id === prodId ? newProduct : p);
        } else {
          updatedList = [newProduct, ...dbProducts];
        }
        // If empty, seed from mock data first
        if (dbProducts.length === 0) {
          const seededList = PRODUCTS.map(p => p.id === prodId ? newProduct : p);
          if (!editingProduct) seededList.unshift(newProduct);
          updatedList = seededList;
        }
        localStorage.setItem('mock_products_db', JSON.stringify(updatedList));
      } else {
        await setDoc(doc(db, 'products', prodId), newProduct);
      }

      setIsOpen(false);
      loadProducts();
    } catch (err) {
      setError("Failed to save product information.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (prodId) => {
    if (!window.confirm("Are you sure you want to delete this snack product?")) return;

    try {
      if (isFirebaseMock) {
        const dbProducts = JSON.parse(localStorage.getItem('mock_products_db') || '[]');
        const listToFilter = dbProducts.length > 0 ? dbProducts : PRODUCTS;
        const updatedList = listToFilter.filter(p => p.id !== prodId);
        localStorage.setItem('mock_products_db', JSON.stringify(updatedList));
      } else {
        await deleteDoc(doc(db, 'products', prodId));
      }
      loadProducts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <input 
            type="text" 
            placeholder="Search snacks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input rounded-full py-2.5 pl-10 pr-4 text-xs font-semibold"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs px-5 py-3 rounded-full shadow-md flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Snack
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="glass-panel p-6 rounded-3xl bg-white/40 border-white/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-saffron-light/20 text-charcoal/40 uppercase font-bold tracking-wider">
                <th className="pb-3 pl-3">Image</th>
                <th className="pb-3">Snack Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Variants (Weight & Stock)</th>
                <th className="pb-3">Base Price</th>
                <th className="pb-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod) => (
                <tr key={prod.id} className="border-b border-saffron-light/10 hover:bg-white/30 transition-colors">
                  <td className="py-3 pl-3">
                    <img 
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78'} 
                      alt={prod.name} 
                      className="w-10 h-10 object-cover rounded-lg border border-saffron-light/10 shadow-sm"
                    />
                  </td>
                  <td className="py-3 font-bold text-charcoal">{prod.name}</td>
                  <td className="py-3 capitalize text-charcoal/60 font-semibold">
                    {CATEGORIES.find(c => c.id === prod.category)?.name || prod.category}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {prod.variants?.map((v) => (
                        <span key={v.weight} className="bg-cream-container border border-saffron-light/10 text-[9px] font-bold px-2 py-0.5 rounded-full text-charcoal/70">
                          {v.weight} ({v.stock})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 font-heading font-extrabold text-maroon">₹{prod.price}</td>
                  <td className="py-3 pr-3 text-right">
                    <div className="flex justify-end gap-2.5">
                      <button 
                        onClick={() => handleOpenModal(prod)}
                        className="p-1.5 rounded-full hover:bg-saffron-light/30 text-saffron-dark transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 rounded-full hover:bg-maroon-light/30 text-maroon transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT SNACK MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsOpen(false)} className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" />
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-cream/95 max-w-xl w-full max-h-[90vh] overflow-y-auto z-10 shadow-2xl relative border-saffron-light/30">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-saffron-light/20">
              <X className="w-6 h-6" />
            </button>

            <h3 className="font-heading font-extrabold text-lg text-charcoal mb-6 border-b border-saffron-light/20 pb-3">
              {editingProduct ? 'Modify Snack Details' : 'Add New Spiced Snack'}
            </h3>

            {error && (
              <div className="bg-maroon-light/20 border border-maroon-light/40 text-maroon text-xs rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Snack Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Royal Saffron Sev"
                  className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full glass-input rounded-full py-2.5 px-4 text-xs font-semibold cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {/* Cloudinary Upload Trigger */}
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Snack Image</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 bg-white border border-saffron-light/30 hover:border-saffron px-4 py-2.5 rounded-full cursor-pointer text-xs font-bold text-charcoal/80 transition-colors">
                      <Upload className="w-4 h-4 text-saffron" />
                      {uploading ? "Uploading..." : "Upload File"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="sr-only" 
                        disabled={uploading}
                      />
                    </label>
                    {imageUrl && (
                      <div className="flex items-center gap-2 bg-white/50 border border-saffron-light/20 p-1 rounded-2xl shadow-sm">
                        <img 
                          src={imageUrl} 
                          alt="Snack Preview" 
                          className="w-9 h-9 object-cover rounded-xl border border-saffron-light/20"
                        />
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 px-2">
                          <ImageIcon className="w-3.5 h-3.5" /> Uploaded
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase mb-1.5 ml-1">Product Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell customers about the spices, crunch, and heritage story..."
                  rows={3}
                  className="w-full glass-input rounded-2xl py-3 px-4 text-xs font-medium resize-none"
                  required
                />
              </div>

              {/* Weight variants */}
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase">Weight Packages & Inventory</label>
                  <button 
                    type="button" 
                    onClick={handleAddVariant}
                    className="text-[10px] font-bold text-saffron hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="space-y-2.5">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center">
                      <input 
                        type="text" 
                        value={v.weight}
                        onChange={e => handleVariantChange(idx, 'weight', e.target.value)}
                        placeholder="e.g. 250g"
                        className="w-24 glass-input rounded-full py-2 px-3.5 text-xs text-center font-bold"
                        required
                      />
                      <span className="text-xs text-charcoal/30 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={v.price}
                        onChange={e => handleVariantChange(idx, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-24 glass-input rounded-full py-2 px-3.5 text-xs text-center font-bold"
                        required
                      />
                      <span className="text-xs text-charcoal/30 font-bold">Units:</span>
                      <input 
                        type="number" 
                        value={v.stock}
                        onChange={e => handleVariantChange(idx, 'stock', e.target.value)}
                        placeholder="Stock"
                        className="w-24 glass-input rounded-full py-2 px-3.5 text-xs text-center font-bold"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        disabled={variants.length === 1}
                        className="p-1.5 rounded-full hover:bg-maroon-light/20 text-maroon disabled:opacity-30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-saffron-light/20 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="bg-cream-container hover:bg-cream-highest text-charcoal font-semibold text-xs px-5 py-2.5 rounded-full border border-charcoal/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || uploading}
                  className="bg-saffron hover:bg-saffron-dark text-white font-heading font-bold text-xs px-6 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
                >
                  {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
