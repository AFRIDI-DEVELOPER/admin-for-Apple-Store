import React, { useState, useEffect, useRef } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadImage, uploadImages, checkStorageBucket } from '../../services/productService';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: 'iPhone 16 Pro Plus',
        model: '16 Pro',
        price: '149000',
        storage: '256GB',
        color: 'Natural Titanium',
        condition: 'New',
        batteryHealth: '100%',
        image: '', // Cover image
        images: [], // Gallery images (4-5)
        description: ''
    });
    const [formStep, setFormStep] = useState(1); // 1: Media, 2: Details
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, productId: null, productName: '' });

    const coverInputRef = useRef(null);
    const galleryInputRefs = useRef([]);

    useEffect(() => {
        loadProducts();
        verifyStorage();
    }, []);

    // Reset step when modal closes/opens
    useEffect(() => {
        if (!isModalOpen) {
            setFormStep(1);
        }
    }, [isModalOpen]);

    const verifyStorage = async () => {
        const isBucketOk = await checkStorageBucket();
        if (!isBucketOk) {
            console.warn('Supabase Storage bucket "product-images" not found or not accessible.');
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data || []);
        } catch (error) {
            alert('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, index = -1) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (index === -1) {
                // Main cover image
                setFormData(prev => ({ ...prev, image: reader.result }));
            } else {
                // Gallery image
                setFormData(prev => {
                    const newGallery = [...(prev.images || [])];
                    newGallery[index] = reader.result;
                    return { ...prev, images: newGallery };
                });
            }
            // Reset input so same file can be selected again if removed
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index = -1) => {
        if (index === -1) {
            setFormData(prev => ({ ...prev, image: '' }));
        } else {
            const newGallery = [...formData.images];
            newGallery[index] = null;
            // Filter out nulls to keep array clean
            setFormData(prev => ({ ...prev, images: newGallery.filter(img => img !== null) }));
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name || '',
                model: product.model || '',
                price: product.price || '',
                storage: product.storage || '128GB',
                color: product.color || '',
                condition: product.condition || 'New',
                batteryHealth: product.batteryHealth || '100%',
                image: product.image || '',
                images: product.images || [],
                description: product.description || ''
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                name: '',
                model: '',
                price: '',
                storage: '128GB',
                color: '',
                condition: 'New',
                batteryHealth: '100%',
                image: '',
                images: [],
                description: ''
            });
        }
        setFormStep(1);
        setIsModalOpen(true);
    };

    const handleRLSError = (error) => {
        const isRLS = error.message?.includes('row-level security policy') || error.code === '42501';
        const isBucket = error.message?.includes('bucket') || error.message?.includes('Storage') || error.message?.includes('400');

        if (isRLS) {
            alert('🛑 DATABASE ACCESS DENIED (RLS Error)\nPlease disable RLS for the products table in your Supabase dashboard.');
        } else if (isBucket) {
            alert('🛑 STORAGE ERROR\nThe storage bucket "product-images" failed. Please check your Supabase storage configuration.');
        } else {
            alert('❌ Operation failed: ' + (error.message || 'Unknown error'));
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (formStep === 1) {
            if (!formData.image && !confirm('No cover image selected. Proceed anyway?')) return;
            setFormStep(2);
            return;
        }

        const submitBtn = document.getElementById('submit-product-btn');
        const originalText = submitBtn?.textContent;

        try {
            if (submitBtn) {
                submitBtn.textContent = 'Saving...';
                submitBtn.disabled = true;
            }
            setLoading(true);

            let coverImageUrl = formData.image;
            if (formData.image?.startsWith('data:')) {
                try {
                    coverImageUrl = await uploadImage(formData.image, 'covers');
                } catch (err) {
                    coverImageUrl = currentProduct?.image || '/iphones/iphone-15.png';
                }
            }

            const galleryImages = formData.images?.filter(img => img?.startsWith('data:')) || [];
            let galleryUrls = formData.images?.filter(img => img && !img.startsWith('data:')) || [];

            if (galleryImages.length > 0) {
                try {
                    const uploadedUrls = await uploadImages(galleryImages, 'gallery');
                    galleryUrls = [...galleryUrls, ...uploadedUrls];
                } catch (err) {
                    console.error('Gallery upload failed:', err);
                }
            }

            // Clean price: remove commas and other non-digits
            const cleanPrice = String(formData.price).replace(/[^0-9.]/g, '');

            const dataToSave = {
                ...formData,
                price: Number(cleanPrice) || 0,
                image: coverImageUrl,
                images: galleryUrls,
                description: formData.description || `Premium ${formData.name} with ${formData.storage} storage in ${formData.color}.`
            };

            if (currentProduct) {
                await updateProduct(currentProduct.id, dataToSave);
            } else {
                if (!dataToSave.image) {
                    dataToSave.image = '/iphones/iphone-15.png';
                }
                await createProduct(dataToSave);
            }

            setIsModalOpen(false);
            await loadProducts();
        } catch (error) {
            handleRLSError(error);
        } finally {
            setLoading(false);
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    };

    const handleDelete = (product) => {
        setDeleteConfirm({
            isOpen: true,
            productId: product.id,
            productName: product.name
        });
    };

    const confirmDelete = async () => {
        try {
            setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
            setLoading(true);
            await deleteProduct(deleteConfirm.productId);
            await loadProducts();
        } catch (error) {
            handleRLSError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-management animate-fade-in">
            <header className="admin-header flex-between">
                <div>
                    <h1 className="page-title text-gradient">Product Management</h1>
                    <p className="page-subtitle">Add, edit, or remove iPhones from your store.</p>
                </div>
                <div className="flex gap-sm">
                    <button type="button" className="btn btn-primary glow" onClick={() => handleOpenModal()}>
                        + Add New iPhone
                    </button>
                </div>
            </header>

            {loading && products.length === 0 ? (
                <div className="flex-center" style={{ height: '300px' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="admin-table-container card-glass animate-fade-in-up" style={{ marginTop: '2rem' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Model</th>
                                <th>Price</th>
                                <th>Battery</th>
                                <th>Condition</th>
                                <th>Images</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td className="product-cell">
                                        <div className="flex align-center gap-sm">
                                            <div className="product-mini-img">
                                                <img src={product.image || '/iphones/iphone-15.png'} alt="" />
                                            </div>
                                            <span>{product.name}</span>
                                        </div>
                                    </td>
                                    <td>{product.model}</td>
                                    <td>₹{product.price?.toLocaleString()}</td>
                                    <td>{product.batteryHealth}</td>
                                    <td>
                                        <span className={`badge ${product.condition === 'New' ? 'badge-success' : 'badge-warning'}`}>
                                            {product.condition}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-xs">
                                            <span className="count-badge">{(product.images?.length || 0) + (product.image ? 1 : 0)}</span>
                                        </div>
                                    </td>
                                    <td className="table-actions">
                                        <button type="button" className="btn-icon" title="Edit" onClick={() => handleOpenModal(product)}>✏️</button>
                                        <button type="button" className="btn-icon delete" title="Delete Product" onClick={() => handleDelete(product)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content card-glass animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header">
                                <h2>{currentProduct ? 'Edit Product' : 'Add New iPhone'}</h2>
                                <div className="step-indicator">
                                    <span className={`step ${formStep === 1 ? 'active' : ''}`}>1. Media</span>
                                    <span className="step-sep">→</span>
                                    <span className={`step ${formStep === 2 ? 'active' : ''}`}>2. Details</span>
                                </div>
                                <button type="button" className="btn-icon" onClick={() => setIsModalOpen(false)}>✕</button>
                            </div>

                            <div className="modal-scroll-area">
                                {formStep === 1 ? (
                                    <div className="image-management">
                                        <label className="section-label">Media & Images</label>
                                        <div className="image-upload-grid">
                                            <div className="image-slot cover-slot">
                                                {formData.image ? (
                                                    <div className="slot-content">
                                                        <img src={formData.image} alt="Cover" />
                                                        <button type="button" className="slot-remove" onClick={() => removeImage()}>✕</button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="slot-empty clickable"
                                                        onClick={() => coverInputRef.current?.click()}
                                                    >
                                                        <span className="slot-icon">📸</span>
                                                        <span className="slot-text">Cover Image</span>
                                                        <span className="slot-btn">Click to Add</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={coverInputRef}
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileChange(e)}
                                                />
                                            </div>

                                            {[0, 1, 2, 3, 4].map(idx => (
                                                <div key={idx} className="image-slot gallery-slot">
                                                    {formData.images[idx] ? (
                                                        <div className="slot-content">
                                                            <img src={formData.images[idx]} alt={`Gallery ${idx}`} />
                                                            <button type="button" className="slot-remove" onClick={() => removeImage(idx)}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="slot-empty clickable"
                                                            onClick={() => galleryInputRefs.current[idx]?.click()}
                                                        >
                                                            <span className="slot-icon">+</span>
                                                            <span className="slot-add-text">Add</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        ref={el => galleryInputRefs.current[idx] = el}
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleFileChange(e, idx)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="upload-tip">First slot is the main cover image. You can add up to 5 additional gallery photos.</p>
                                    </div>
                                ) : (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Product Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. iPhone 15 Pro Max"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Model</label>
                                            <input
                                                type="text"
                                                value={formData.model}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                placeholder="e.g. iPhone 15 Pro Max"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Price (₹)</label>
                                            <input
                                                type="text"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="e.g. 149000"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Battery Health (%)</label>
                                            <input
                                                type="text"
                                                value={formData.batteryHealth}
                                                onChange={(e) => setFormData({ ...formData, batteryHealth: e.target.value })}
                                                placeholder="e.g. 100% or 95%"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Condition</label>
                                            <select
                                                value={formData.condition}
                                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                            >
                                                <option value="New">New</option>
                                                <option value="Like New">Like New</option>
                                                <option value="Refurbished">Refurbished</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Storage</label>
                                            <input
                                                type="text"
                                                value={formData.storage}
                                                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                                placeholder="e.g. 256GB"
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Color</label>
                                            <input
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                placeholder="e.g. Natural Titanium"
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Enter product description..."
                                                rows="3"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                {formStep === 1 ? (
                                    <>
                                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                        <button type="button" className="btn btn-primary" onClick={() => setFormStep(2)}>Next: Details</button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" className="btn btn-outline" onClick={() => setFormStep(1)}>Back</button>
                                        <button type="button" id="submit-product-btn" className="btn btn-primary" onClick={handleSubmit}>{currentProduct ? 'Save Changes' : 'Add Product'}</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm.isOpen && (
                <div className="modal-overlay delete-confirm-overlay" onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}>
                    <div className="modal-content delete-confirm-modal card-glass animate-scale-in" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxWidth: '400px', padding: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Delete Product?</h2>
                            <p style={{ color: 'var(--gray-400)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Are you sure you want to delete <strong>{deleteConfirm.productName}</strong>? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={confirmDelete}
                                    style={{ flex: 1, backgroundColor: '#ff3b30' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .product-management { padding: 1rem; }
                .admin-header { margin-bottom: 2rem; }
                .admin-table-container { overflow-x: auto; background: rgba(255, 255, 255, 0.03); border-radius: 12px; }
                .admin-table { width: 100%; border-collapse: collapse; min-width: 600px; }
                .admin-table th, .admin-table td { padding: 1rem 1.25rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .admin-table th { color: var(--gray-400); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
                
                .product-mini-img { width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .product-mini-img img { width: 100%; height: 100%; object-fit: contain; }
                .count-badge { background: var(--primary); color: white; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                
                .table-actions { display: flex; gap: 0.5rem; }
                .btn-icon { background: rgba(255,255,255,0.05); border: none; cursor: pointer; padding: 0.5rem; border-radius: 8px; font-size: 1rem; color: var(--light); transition: all 0.2s; display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; }
                .btn-icon:hover { background: var(--primary); transform: translateY(-2px); }
                .btn-icon.delete:hover { background: #ff3b30; }

                /* Premium Modal Styling */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(12px); padding: 1rem; }
                .modal-content { width: 100%; max-width: 750px; padding: 2rem; border-radius: var(--radius-lg); height: 90vh; max-height: 800px; display: flex; flex-direction: column; overflow: hidden; }
                .modal-scroll-area { flex: 1; overflow-y: auto; padding-right: 0.5rem; scrollbar-width: thin; scrollbar-color: var(--gray-700) transparent; display: flex; flex-direction: column; }
                .modal-scroll-area::-webkit-scrollbar { width: 6px; }
                .modal-scroll-area::-webkit-scrollbar-thumb { background: var(--gray-700); border-radius: 3px; }

                .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
                .modal-header h2 { margin: 0; font-size: 1.25rem; }
                .step-indicator { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; }
                .step { color: var(--gray-500); transition: color 0.3s; font-weight: 500; white-space: nowrap; }
                .step.active { color: var(--primary); }
                .step-sep { color: var(--gray-700); }

                /* Image Component UI */
                .image-management { margin-bottom: 1.5rem; flex: 1; }
                .section-label { display: block; margin-bottom: 1.25rem; font-weight: 700; color: var(--light); font-size: 1.1rem; }
                .image-upload-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                .image-slot { position: relative; aspect-ratio: 1; border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; background: rgba(255,255,255,0.02); }
                .image-slot.cover-slot { grid-row: span 2; grid-column: span 2; border-style: solid; border-color: var(--primary); background: rgba(0, 122, 255, 0.05); }
                .image-slot:hover { border-color: var(--primary); background: rgba(0, 122, 255, 0.08); transform: scale(1.02); }
                
                .slot-trigger, .slot-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
                .slot-trigger img, .slot-content img { width: 100%; height: 100%; object-fit: contain; padding: 0.75rem; }
                .slot-empty { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--gray-500); transition: all 0.3s; }
                .clickable { cursor: pointer; }
                .slot-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
                .cover-slot .slot-icon { font-size: 2.5rem; }
                .slot-text { font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem; }
                .slot-btn { background: var(--primary); color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; opacity: 0; transform: translateY(5px); transition: all 0.3s; }
                .slot-empty:hover .slot-btn { opacity: 1; transform: translateY(0); }
                .slot-add-text { font-size: 0.75rem; font-weight: 600; color: var(--gray-400); }
                
                .slot-remove { position: absolute; top: 10px; right: 10px; background: rgba(255,59,48,0.9); border: none; color: white; width: 26px; height: 26px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; transition: transform 0.2s; }
                .slot-remove:hover { transform: scale(1.2); background: #ff3b30; }
                
                .upload-tip { font-size: 0.75rem; color: var(--gray-500); margin-top: 1rem; font-style: italic; }

                /* Form Layout */
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                .full-width { grid-column: span 2; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--gray-300); font-weight: 500; }
                .form-group input, .form-group select { width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; }
                
                .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); margin-top: auto; }
                
                /* Mobile Specific Improvements */
                @media (max-width: 768px) {
                    .admin-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .admin-header .flex { width: 100%; }
                    .admin-header .btn { width: 100%; }
                    
                    .modal-content { padding: 1.5rem; height: 95vh; }
                    .form-grid { grid-template-columns: 1fr; }
                    .full-width { grid-column: span 1; }
                    
                    .image-upload-grid { grid-template-columns: repeat(3, 1fr); }
                    .cover-slot { grid-column: span 3; }
                    
                    .form-actions { flex-direction: column; }
                    .form-actions .btn { width: 100%; }
                }

                @media (max-width: 480px) {
                    .product-management { padding: 0.75rem; }
                    .page-title { font-size: 1.75rem; }
                    .admin-table-container { border-radius: 8px; }
                    
                    .image-upload-grid { grid-template-columns: repeat(2, 1fr); }
                    .cover-slot { grid-column: span 2; }
                    
                    .step-indicator { width: 100%; overflow-x: auto; padding-bottom: 0.5rem; }
                }
            `}</style>
        </div>
    );
};

export default ProductManagement;
