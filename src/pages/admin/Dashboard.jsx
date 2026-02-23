import React from 'react';

const Dashboard = () => {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Dashboard
            </h1>
            <p style={{ color: 'var(--gray-400)', marginBottom: '2rem' }}>
                Welcome to the admin panel.
            </p>

            <div className="dashboard-grid">
                <div className="stat-card card-glass">
                    <span className="stat-label">Total Products</span>
                    <span className="stat-value">—</span>
                </div>
                <div className="stat-card card-glass">
                    <span className="stat-label">Categories</span>
                    <span className="stat-value">—</span>
                </div>
                <div className="stat-card card-glass">
                    <span className="stat-label">Site Visits</span>
                    <span className="stat-value">—</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
