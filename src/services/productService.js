import { supabase, isSupabaseConfigured, supabaseAdmin } from '../lib/supabaseClient';


/**
 * Upload an image to Supabase Storage
 * @param {string|File} imageData - Base64 string or File object
 * @param {string} folder - Folder name (e.g., 'covers' or 'gallery')
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
/**
 * Check if the product-images bucket exists and is accessible
 * @returns {Promise<boolean>}
 */
export const checkStorageBucket = async () => {
    if (!isSupabaseConfigured()) return true;

    try {
        const { error } = await supabaseAdmin.storage.getBucket('product-images');
        return !error;
    } catch (error) {
        return false;
    }
};

export const uploadImage = async (imageData, folder = 'products') => {
    if (!isSupabaseConfigured()) return imageData;

    try {
        let file;
        let fileName;
        let mimeType = 'image/jpeg';

        if (typeof imageData === 'string') {
            if (imageData.startsWith('http') || imageData.startsWith('/')) return imageData;

            const parts = imageData.split(',');
            mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            file = new Blob([u8arr], { type: mimeType });

            const extension = mimeType.split('/')[1] || 'jpg';
            fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        } else if (imageData instanceof File) {
            file = imageData;
            const extension = imageData.name.split('.').pop() || 'jpg';
            fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        } else {
            throw new Error('Invalid image data type');
        }

        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        const { data: urlData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Upload failure:', error);
        throw error;
    }
};

/**
 * Upload multiple images
 * @param {Array<string|File>} images - Array of base64 strings or File objects
 * @param {string} folder - Folder name
 * @returns {Promise<string[]>} - Array of public URLs
 */
export const uploadImages = async (images, folder = 'gallery') => {
    if (!images || images.length === 0) return [];

    const uploadPromises = images.map(img => uploadImage(img, folder));
    return Promise.all(uploadPromises);
};

// Mock product data (fallback when Supabase is not configured)
const mockProducts = [
    {
        id: 7,
        name: 'iPhone 17 Pro',
        model: 'iPhone 17 Pro',
        storage: '256GB',
        color: 'Deep Purple',
        batteryHealth: '100%',
        price: 154900,
        originalPrice: 179900,
        condition: 'New',
        image: '/iphones/iphone-17.png',
        description: 'The future of mobile technology with advanced AI features and unparalleled performance.',
        specs: ['6.7" Super Retina XDR', 'A18 Bionic Chip', '48MP Triple Camera', 'AI Integration'],
        inStock: true
    },
    {
        id: 8,
        name: 'iPhone 16 Pro',
        model: 'iPhone 16 Pro',
        storage: '128GB',
        color: 'Gold',
        batteryHealth: '100%',
        price: 139900,
        originalPrice: 159900,
        condition: 'New',
        image: '/iphones/iphone-16.png',
        description: 'Elegance meets power. Experience the next level of Pro performance.',
        specs: ['6.3" Pro Display', 'A18 Pro Chip', '48MP Camera', 'Action Button'],
        inStock: true
    },
    {
        id: 1,
        name: 'iPhone 15 Pro Max',
        model: 'iPhone 15 Pro Max',
        storage: '256GB',
        color: 'Natural Titanium',
        batteryHealth: '100%',
        price: 134900,
        originalPrice: 159900,
        condition: 'New',
        image: '/iphones/iphone-15-pro-max.png',
        description: 'The ultimate iPhone with titanium design, A17 Pro chip, and ProMotion display.',
        specs: ['6.7" Super Retina XDR', 'A17 Pro Chip', '48MP Main Camera', '5G'],
        inStock: true
    },
    {
        id: 2,
        name: 'iPhone 15 Pro',
        model: 'iPhone 15 Pro',
        storage: '128GB',
        color: 'Blue Titanium',
        batteryHealth: '100%',
        price: 124900,
        condition: 'New',
        image: '/iphones/iphone-15-pro-blue.png',
        description: 'Pro performance with titanium design and advanced camera system.',
        specs: ['6.1" Super Retina XDR', 'A17 Pro Chip', '48MP Main Camera', '5G'],
        inStock: true
    },
    {
        id: 3,
        name: 'iPhone 15',
        model: 'iPhone 15',
        storage: '128GB',
        color: 'Pink',
        batteryHealth: '100%',
        price: 79900,
        condition: 'New',
        image: '/iphones/iphone-15-pink.png',
        description: 'Dynamic Island. 48MP Main camera. All-day battery life.',
        specs: ['6.1" Super Retina XDR', 'A16 Bionic Chip', '48MP Camera', '5G'],
        inStock: true
    },
    {
        id: 4,
        name: 'iPhone 14',
        model: 'iPhone 14',
        storage: '128GB',
        color: 'Midnight',
        batteryHealth: '95%',
        price: 89900,
        originalPrice: 109900,
        condition: 'Like New',
        image: '/iphones/iphone-14.png',
        description: 'Dependable performance with a great camera system.',
        specs: ['6.1" Super Retina XDR', 'A15 Bionic', '48MP Camera', 'All-day battery'],
        inStock: true
    },
    {
        id: 5,
        name: 'iPhone 13',
        model: 'iPhone 13',
        storage: '128GB',
        color: 'Green',
        batteryHealth: '92%',
        price: 54900,
        originalPrice: 69900,
        condition: 'Like New',
        image: '/iphones/iphone-13.png',
        description: 'The iconic iPhone with a powerful A15 chip.',
        specs: ['6.1" Super Retina XDR', 'A15 Bionic', 'Dual Camera', '5G'],
        inStock: true
    },
    {
        id: 6,
        name: 'iPhone 12',
        model: 'iPhone 12',
        storage: '64GB',
        color: 'Product RED',
        batteryHealth: '89%',
        price: 44900,
        originalPrice: 59900,
        condition: 'Refurbished',
        image: '/iphones/iphone-12.png',
        description: 'A great entry into the iPhone ecosystem.',
        specs: ['6.1" OLED Display', 'A14 Bionic', 'Dual Camera', 'Night Mode'],
        inStock: true
    }
];

// Helper to convert Supabase snake_case to camelCase
const mapProductFromDB = (product) => ({
    id: product.id,
    name: product.name,
    model: product.model,
    storage: product.storage,
    color: product.color,
    batteryHealth: product.battery_health,
    price: product.price,
    originalPrice: product.original_price,
    condition: product.condition,
    image: product.image,
    images: product.images || [],
    description: product.description,
    specs: product.specs || [],
    inStock: product.in_stock,
    isFeatured: product.is_featured,
    createdAt: product.created_at
});

// Helper to convert camelCase to Supabase snake_case
const mapProductToDB = (product) => ({
    name: product.name,
    model: product.model,
    storage: product.storage,
    color: product.color,
    battery_health: product.batteryHealth || '100%',
    price: parseInt(product.price),
    original_price: product.originalPrice ? parseInt(product.originalPrice) : null,
    condition: product.condition || 'New',
    image: product.image,
    images: product.images || [],
    description: product.description,
    specs: product.specs || [],
    in_stock: product.inStock !== false,
    is_featured: product.isFeatured || false
});

// Mock mode helpers (localStorage persistence)
const getStoreProducts = () => {
    const stored = localStorage.getItem('anas_products');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored products', e);
        }
    }
    return mockProducts;
};

const saveStoreProducts = (products) => {
    localStorage.setItem('anas_products', JSON.stringify(products));
};

/**
 * Get all products with optional filters
 */
export const getProducts = async (filters = {}) => {
    if (isSupabaseConfigured()) {
        let query = supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.model && filters.model !== 'all') {
            query = query.eq('model', filters.model);
        }

        if (filters.condition && filters.condition !== 'all') {
            query = query.eq('condition', filters.condition);
        }

        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice);
        }

        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,model.ilike.%${filters.search}%,color.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            throw new Error(error.message);
        }

        return data.map(mapProductFromDB);
    } else {
        // Fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 500));

        let allProducts = getStoreProducts();
        let filteredProducts = [...allProducts];

        if (filters.model && filters.model !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.model === filters.model);
        }

        if (filters.condition && filters.condition !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.condition === filters.condition);
        }

        if (filters.minPrice) {
            filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice);
        }

        if (filters.maxPrice) {
            filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredProducts = filteredProducts.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.model.toLowerCase().includes(searchLower) ||
                p.color.toLowerCase().includes(searchLower)
            );
        }

        return filteredProducts;
    }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id) => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            throw new Error('Product not found');
        }

        return mapProductFromDB(data);
    } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        const allProducts = getStoreProducts();
        const product = allProducts.find(p => p.id === parseInt(id) || p.id === id);
        if (!product) throw new Error('Product not found');
        return product;
    }
};

/**
 * Create a new product
 */
export const createProduct = async (productData) => {
    if (isSupabaseConfigured()) {
        const dbProduct = mapProductToDB(productData);

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(dbProduct)
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            throw new Error(error.message);
        }

        return mapProductFromDB(data);
    } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        const allProducts = getStoreProducts();
        const newProduct = {
            ...productData,
            id: Date.now(),
            inStock: true
        };
        const updated = [newProduct, ...allProducts];
        saveStoreProducts(updated);
        return newProduct;
    }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id, productData) => {
    if (isSupabaseConfigured()) {
        const dbProduct = mapProductToDB(productData);

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(dbProduct)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            throw new Error(error.message);
        }

        return mapProductFromDB(data);
    } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        const allProducts = getStoreProducts();
        const index = allProducts.findIndex(p => p.id === parseInt(id) || p.id === id);
        if (index === -1) throw new Error('Product not found');

        const updatedProduct = { ...allProducts[index], ...productData };
        allProducts[index] = updatedProduct;
        saveStoreProducts(allProducts);
        return updatedProduct;
    }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id) => {
    if (isSupabaseConfigured()) {
        console.log(`🗑️ Deleting product ${id} from Supabase...`);
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase delete error:', error);
            throw new Error(`Delete failed: ${error.message} (${error.code || 'no code'})`);
        }

        console.log('✅ Supabase delete successful');
        return true;
    } else {
        console.log(`📦 Mock Deleting product ${id}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        const allProducts = getStoreProducts();
        const filtered = allProducts.filter(p => p.id !== parseInt(id) && p.id !== id);
        saveStoreProducts(filtered);
        return true;
    }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async () => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(6);

        if (error) {
            console.error('Error fetching featured products:', error);
            // Fallback to getting first 3 products
            const { data: allData } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            return (allData || []).map(mapProductFromDB);
        }

        // If no featured products, return first 3
        if (data.length === 0) {
            const { data: allData } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            return (allData || []).map(mapProductFromDB);
        }

        return data.map(mapProductFromDB);
    } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        const allProducts = getStoreProducts();
        return allProducts.slice(0, 3);
    }
};

/**
 * Get unique models for filtering
 */
export const getProductModels = async () => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase
            .from('products')
            .select('model')
            .order('model');

        if (error) {
            console.error('Error fetching models:', error);
            return [];
        }

        // Get unique models
        const uniqueModels = [...new Set(data.map(p => p.model))];
        return uniqueModels;
    } else {
        const allProducts = getStoreProducts();
        const uniqueModels = [...new Set(allProducts.map(p => p.model))];
        return uniqueModels;
    }
};
