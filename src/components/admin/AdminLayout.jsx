import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Admin.css';

const AdminLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1209023112') {
            setIsAuthorized(true);
        } else {
            setError('Incorrect password. Please try again.');
            setPassword('');
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    if (!isAuthorized) {
        return (
            <div className="admin-login-screen">
                <div className="login-card card-glass animate-scale-in">
                    <div className="login-header">
                        <span className="lock-icon">🔒</span>
                        <h1>Admin Access</h1>
                        <p>Please enter the administrator password to continue.</p>
                    </div>
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <button type="submit" className="btn btn-primary glow w-full">
                            Unlock Panel
                        </button>
                    </form>
                    <a href="http://localhost:5173" className="back-to-site">← Back to Shop</a>
                </div>
            </div>
        );
    }

    return (
        <div className={`admin-layout ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
            {/* Mobile Header */}
            <header className="admin-mobile-header">
                <div className="flex-between w-full">
                    <span className="brand-text">Admin Panel</span>
                    <button className="mobile-toggle" onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                <nav className="sidebar-nav">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/products"
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Add Products
                    </NavLink>
                    <a
                        href="http://localhost:5173"
                        className="nav-item back-link"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Back to Site
                    </a>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && <div className="admin-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;

