import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductManagement />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
