import React, { useState, useEffect } from 'react';
import { getProducts } from '../../services/productService';

const Dashboard = () => {
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch products
            const products = await getProducts();
            setTotalProducts(products.length);

            // Calculate total amount (sum of all product prices)
            const amount = products.reduce((sum, product) => sum + (Number(product.price) || 0), 0);
            setTotalAmount(amount);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return '₹' + value.toLocaleString('en-IN');
    };

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Dashboard
            </h1>
            <p style={{ color: 'var(--gray-400)', marginBottom: '2rem' }}>
                Welcome to the admin panel. Here's an overview of your store.
            </p>

            <div className="dashboard-grid">
                <div className="stat-card card-glass">
                    <span className="stat-label">📦 Total Products</span>
                    <span className="stat-value">
                        {loading ? '...' : totalProducts}
                    </span>
                </div>
                <div className="stat-card card-glass">
                    <span className="stat-label">💰 Total Amount</span>
                    <span className="stat-value" style={{ fontSize: totalAmount > 999999 ? '1.75rem' : '2.5rem' }}>
                        {loading ? '...' : formatCurrency(totalAmount)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
