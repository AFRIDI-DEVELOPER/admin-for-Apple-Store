import React from 'react';

const Dashboard = () => {
    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome to the ANAS iPhone Shop admin panel.</p>
            </header>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <span className="stat-label">Total Sales</span>
                    <div className="stat-value">₹0</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active Orders</span>
                    <div className="stat-value">0</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Total Products</span>
                    <div className="stat-value">8</div>
                </div>
            </div>

            <section className="recent-activity" style={{ marginTop: '4rem' }}>
                <h3>Recent Activity</h3>
                <p style={{ color: '#666', marginTop: '1rem' }}>No recent activity to show yet.</p>
            </section>
        </div>
    );
};

export default Dashboard;
