import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Edit2, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/modal';
import { productsAPI } from '@/services/api';
import { purchasesAPI } from '@/services/api';
import { validateRequired, validatePrice, validateStock } from '@/lib/validators';

const Purchases = () => {
    const [products, setProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Form state
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: '',
        price: '',
        stock: ''
    });

    useEffect(() => {
        loadProducts();
        loadPurchases();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productsAPI.getAll();
            setProducts(data);
        } catch (err) {
            setError(err);
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await purchasesAPI.getDetailAll();
            console.log('Loaded purchases:', data);
            setPurchases(data);
        } catch (err) {
            setError(err);
            console.error('Error loading purchases:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (stock) => {
        if (stock === 0) return 'Agotado';
        if (stock < 20) return 'Bajo Stock';
        return 'Disponible';
    };

    const validateFormData = () => {
        const errors = {};
        const nameResult = validateRequired(formData.name, 'El nombre');
        if (!nameResult.valid) errors.name = nameResult.message;
        const priceResult = validatePrice(formData.price);
        if (!priceResult.valid) errors.price = priceResult.message;
        if (formData.stock !== '' && formData.stock !== undefined) {
            const stockResult = validateStock(formData.stock);
            if (!stockResult.valid) errors.stock = stockResult.message;
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddProduct = async () => {
        if (!validateFormData()) return;

        setIsSubmitting(true);
        try {
            await productsAPI.create({
                sku: formData.sku || `SKU-${Date.now()}`,
                name: formData.name,
                category: formData.category || 'General',
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock) || 0
            });
            await loadProducts();
            setIsAddModalOpen(false);
            resetForm();
        } catch (err) {
            alert('Error al crear producto: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProduct = async () => {
        if (!validateFormData()) return;

        setIsSubmitting(true);
        try {
            await productsAPI.update(selectedProduct.id, {
                sku: formData.sku,
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock)
            });
            await loadProducts();
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            resetForm();
        } catch (err) {
            alert('Error al actualizar producto: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async () => {
        setIsSubmitting(true);
        try {
            await productsAPI.delete(selectedProduct.id);
            await loadProducts();
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            sku: product.sku || '',
            name: product.name,
            category: product.category || '',
            price: product.price.toString(),
            stock: product.stock.toString()
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ sku: '', name: '', category: '', price: '', stock: '' });
        setFormErrors({});
    };

    const renderFieldError = (field) => {
        if (!formErrors[field]) return null;
        return <p className="text-red-500 text-xs mt-1 font-medium">{formErrors[field]}</p>;
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPurchases = purchases.filter(purchase =>
        purchase.purchase_id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.supplier_id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.purchase.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Compras</h2>
                        <p className="text-blue-100 text-lg opacity-90">Registro de compras y proveedores</p>
                    </div>
                    <Button
                        className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                    >
                        <Plus className="mr-2 h-5 w-5" /> Agregar Producto
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <Card className="border-none shadow-xl transition-all duration-300">
                    <CardHeader className="p-6 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                                    placeholder="Buscar por nombre, código o categoría..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="h-11 border-2 font-bold gap-2" onClick={loadProducts}>
                                    <Loader2 size={18} className={loading ? 'animate-spin' : ''} /> Recargar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">
                                <p>Error al cargar productos</p>
                                <Button onClick={loadProducts} className="mt-4">Reintentar</Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">ID Compra</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Proveedor</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Producto</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Precio Unitario de Venta</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Cantidad</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Precio Unitario de Compra</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Método Pago</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">Estado</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredPurchases.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No hay compras registradas</td>
                                                </tr>
                                            ) : (
                                                filteredPurchases.map((purchase) => {
                                                    return (
                                                        // <tr key={purchase.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <tr
                                                            key={purchase.id}
                                                            className={cn(
                                                                "transition-colors group",
                                                                parseFloat(purchase.cost_price || 0) > parseFloat(purchase.price_venta || 0)
                                                                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                                    : "hover:bg-blue-50/30"
                                                            )}
                                                        >
                                                            <td className="px-6 py-4 font-mono text-xs text-gray-800 font-bold">#{purchase.purchase_id}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="font-medium text-gray-800">{purchase.supplier_name || '-'}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="font-medium text-gray-800">{purchase.product_name || '-'}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                $ {parseFloat(purchase.price_venta || 0).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="font-medium text-gray-800">{purchase.quantity || '-'}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                $ {parseFloat(purchase.cost_price || 0).toFixed(2)}
                                                            </td>

                                                            <td className="px-6 py-4 text-right font-black text-gray-700">
                                                                $ {parseFloat((purchase.quantity * purchase.cost_price) || 0).toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="bg-blue-50 px-3 py-1 rounded-full text-xs font-semibold text-blue-600 border border-blue-200">
                                                                    {purchase.payment_method || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={cn(
                                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                                    purchase.status === 'Completada' && "bg-green-50 text-green-600 border-green-200",
                                                                    purchase.status === 'Pendiente' && "bg-orange-50 text-orange-600 border-orange-200",
                                                                    purchase.status === 'Cancelada' && "bg-red-50 text-red-600 border-red-200",
                                                                    !purchase.status && "bg-gray-50 text-gray-600 border-gray-200"
                                                                )}>
                                                                    {purchase.status || 'Desconocido'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {new Date(purchase.timestamp).toLocaleDateString('es-NI')}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => openEditModal(purchase)}>
                                                                        <Edit2 size={16} />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => openDeleteModal(purchase)}>
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-slate-50/30">
                                    <span className="text-sm text-muted-foreground font-medium">
                                        Mostrando {filteredPurchases.length} de {purchases.length} compras
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Product Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Agregar Nuevo Producto"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleAddProduct} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Nombre del Producto *</label>
                            <Input
                                placeholder="Ej. Paracetamol 500mg"
                                value={formData.name}
                                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                                className={formErrors.name ? 'border-red-400' : ''}
                            />
                            {renderFieldError('name')}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Código / SKU</label>
                            <Input
                                placeholder="Ej. PARA-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Categoría</label>
                        <Input
                            placeholder="Ej. Analgésicos"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Precio ($) *</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => { setFormData({ ...formData, price: e.target.value }); setFormErrors({ ...formErrors, price: undefined }); }}
                                className={formErrors.price ? 'border-red-400' : ''}
                            />
                            {renderFieldError('price')}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Stock Inicial</label>
                            <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => { setFormData({ ...formData, stock: e.target.value }); setFormErrors({ ...formErrors, stock: undefined }); }}
                                className={formErrors.stock ? 'border-red-400' : ''}
                            />
                            {renderFieldError('stock')}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit Product Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Producto"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleEditProduct} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Nombre del Producto *</label>
                            <Input
                                placeholder="Ej. Paracetamol 500mg"
                                value={formData.name}
                                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                                className={formErrors.name ? 'border-red-400' : ''}
                            />
                            {renderFieldError('name')}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Código / SKU</label>
                            <Input
                                placeholder="Ej. PARA-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Categoría</label>
                        <Input
                            placeholder="Ej. Analgésicos"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Precio ($) *</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => { setFormData({ ...formData, price: e.target.value }); setFormErrors({ ...formErrors, price: undefined }); }}
                                className={formErrors.price ? 'border-red-400' : ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Stock</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Eliminar Producto"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteProduct} disabled={isSubmitting}>
                            {isSubmitting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </>
                }
            >
                <div className="py-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que deseas eliminar <strong>{selectedProduct?.name}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
                </div>
            </Modal>
        </Layout>
    );
};

export default Purchases;
