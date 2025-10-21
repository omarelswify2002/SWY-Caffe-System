// Trash Management System
class TrashManager {
    constructor() {
        this.trashedProducts = this.loadTrashedProducts();
        this.trashedOrders = this.loadTrashedOrders();
        this.products = this.loadProducts();
        this.orders = this.loadOrders();

        this.initEventListeners();
        this.checkAccess();
    }
    
    async checkAccess() {
        const { value: password } = await Swal.fire({
            title: 'الوصول إلى سلة المحذوفات',
            text: 'يرجى إدخال كلمة المرور للوصول إلى سلة المحذوفات',
            input: 'password',
            inputPlaceholder: 'كلمة المرور',
            showCancelButton: true,
            confirmButtonText: 'دخول',
            cancelButtonText: 'إلغاء',
            inputValidator: (value) => {
                if (!value) {
                    return 'يرجى إدخال كلمة المرور';
                } else if (value !== 'admin123') {
                    return 'كلمة المرور غير صحيحة';
                }
            }
        });

        if (!password) {
            window.location.href = 'admin.html';
            return;
        }

        this.renderTrashedProducts();
    }
    
    initEventListeners() {
        document.getElementById('restoreAllBtn').addEventListener('click', () => {
            this.restoreAllProducts();
        });
        
        document.getElementById('emptyTrashBtn').addEventListener('click', () => {
            this.emptyTrash();
        });
    }
    
    renderTrashedProducts() {
        const container = document.getElementById('trashContainer');

        if (this.trashedProducts.length === 0 && this.trashedOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-trash-state">
                    <i class="fas fa-trash"></i>
                    <h3>سلة المحذوفات فارغة</h3>
                    <p>لا توجد منتجات أو طلبات محذوفة</p>
                </div>
            `;
            return;
        }
        
        const categoryNames = {
            'hot-drinks': 'المشروبات الساخنة',
            'cold-drinks': 'المشروبات الباردة',
            'ice-cream': 'الآيس كريم',
            'milkshake': 'الميلك شيك'
        };
        
        const categoryIcons = {
            'hot-drinks': 'fas fa-mug-hot',
            'cold-drinks': 'fas fa-glass-whiskey',
            'ice-cream': 'fas fa-ice-cream',
            'milkshake': 'fas fa-blender'
        };
        
        // Combine products and orders for display
        const allTrashItems = [];

        // Add trashed products
        this.trashedProducts.forEach(product => {
            allTrashItems.push({
                type: 'product',
                data: product,
                deletedAt: product.deletedAt
            });
        });

        // Add trashed orders
        this.trashedOrders.forEach(orderGroup => {
            allTrashItems.push({
                type: 'orders',
                data: orderGroup,
                deletedAt: orderGroup.deletedAt
            });
        });

        // Sort by deletion date (newest first)
        allTrashItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

        container.innerHTML = allTrashItems.map(item => {
            if (item.type === 'product') {
                return this.renderTrashedProduct(item.data);
            } else {
                return this.renderTrashedOrders(item.data);
            }
        }).join('');
    }

    renderTrashedProduct(product) {
        const categoryNames = {
            'hot-drinks': 'المشروبات الساخنة',
            'cold-drinks': 'المشروبات الباردة',
            'ice-cream': 'الآيس كريم',
            'milkshake': 'الميلك شيك'
        };

        const categoryIcons = {
            'hot-drinks': 'fas fa-mug-hot',
            'cold-drinks': 'fas fa-glass-whiskey',
            'ice-cream': 'fas fa-ice-cream',
            'milkshake': 'fas fa-blender'
        };

        const imageHTML = product.image
            ? `<img src="${product.image}" alt="${product.name}" class="product-image">`
            : `<div class="product-default-image"><i class="${categoryIcons[product.category]}"></i></div>`;

        return `
            <div class="trash-item product-item">
                <div class="trash-item-header">
                    <div style="display: flex; align-items: center;">
                        <div class="product-image-container">
                            ${imageHTML}
                        </div>
                        <div class="trash-item-info">
                            <div class="trash-item-name">
                                <i class="fas fa-box"></i> ${product.name}
                            </div>
                            <div class="trash-item-category">${categoryNames[product.category]}</div>
                            <div class="deleted-date">
                                <i class="fas fa-calendar"></i>
                                تم الحذف: ${new Date(product.deletedAt).toLocaleDateString('ar-EG')}
                                ${new Date(product.deletedAt).toLocaleTimeString('ar-EG')}
                            </div>
                        </div>
                    </div>
                    <div class="trash-item-actions">
                        <button class="restore-btn" onclick="trashManager.restoreProduct('${product.id}')">
                            <i class="fas fa-undo"></i> استرجاع
                        </button>
                        <button class="delete-permanent-btn" onclick="trashManager.deleteProductPermanently('${product.id}')">
                            <i class="fas fa-trash-alt"></i> حذف نهائي
                        </button>
                    </div>
                </div>

                <div class="trash-item-details">
                    <div class="trash-detail">
                        <div class="trash-detail-label">الوصف</div>
                        <div class="trash-detail-value">${product.description}</div>
                    </div>
                    <div class="trash-detail">
                        <div class="trash-detail-label">السعر</div>
                        <div class="trash-detail-value">${product.price} جنية</div>
                    </div>
                    <div class="trash-detail">
                        <div class="trash-detail-label">عدد الطلبات</div>
                        <div class="trash-detail-value">${product.orderCount || 0}</div>
                    </div>
                    <div class="trash-detail">
                        <div class="trash-detail-label">تاريخ الإنشاء</div>
                        <div class="trash-detail-value">${new Date(product.createdAt).toLocaleDateString('ar-EG')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTrashedOrders(orderGroup) {
        const getSugarText = (sugarValue) => {
            if (sugarValue === null || sugarValue === undefined) return '';
            const sugar = parseFloat(sugarValue);
            if (sugar === 0) return 'بدون سكر';
            return `${sugar} ملعقة سكر`;
        };

        return `
            <div class="trash-item orders-item">
                <div class="trash-item-header">
                    <div class="trash-item-info">
                        <div class="trash-item-name">
                            <i class="fas fa-shopping-cart"></i> طلبات ${orderGroup.productName}
                        </div>
                        <div class="trash-item-category">طلبات غير مكتملة</div>
                        <div class="deleted-date">
                            <i class="fas fa-calendar"></i>
                            تم الحذف: ${new Date(orderGroup.deletedAt).toLocaleDateString('ar-EG')}
                            ${new Date(orderGroup.deletedAt).toLocaleTimeString('ar-EG')}
                        </div>
                    </div>
                    <div class="trash-item-actions">
                        <button class="restore-btn" onclick="trashManager.restoreOrders('${orderGroup.id}')">
                            <i class="fas fa-undo"></i> استرجاع
                        </button>
                        <button class="delete-permanent-btn" onclick="trashManager.deleteOrdersPermanently('${orderGroup.id}')">
                            <i class="fas fa-trash-alt"></i> حذف نهائي
                        </button>
                    </div>
                </div>

                <div class="trash-item-details">
                    <div class="trash-detail">
                        <div class="trash-detail-label">عدد الطلبات</div>
                        <div class="trash-detail-value">${orderGroup.totalOrders}</div>
                    </div>
                    <div class="trash-detail">
                        <div class="trash-detail-label">القيمة الإجمالية</div>
                        <div class="trash-detail-value">${orderGroup.totalValue} جنية</div>
                    </div>
                </div>

                <div class="orders-list">
                    <h4>تفاصيل الطلبات:</h4>
                    ${orderGroup.orders.map((order, index) => `
                        <div class="order-detail">
                            <div class="order-number">${index + 1}</div>
                            <div class="order-content">
                                <div class="order-product-info">
                                    ${order.quantity} × ${orderGroup.productName}
                                    ${order.sugar !== null ? ` (${getSugarText(order.sugar)})` : ''}
                                    - ${order.total} جنية
                                </div>
                                <div class="order-customer-info">
                                    <span class="customer-id">
                                        <i class="fas fa-user"></i>
                                        ${order.customerId || 'غير محدد'}
                                    </span>
                                    <span class="table-number">
                                        <i class="fas fa-table"></i>
                                        طاولة ${order.tableNumber || 'غير محدد'}
                                    </span>
                                    ${order.customerName ? `
                                        <span class="customer-name">
                                            <i class="fas fa-user-tag"></i>
                                            ${order.customerName}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async restoreProduct(productId) {
        const result = await Swal.fire({
            title: 'استرجاع المنتج',
            text: 'هل أنت متأكد من استرجاع هذا المنتج؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، استرجع!',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            const productIndex = this.trashedProducts.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                const product = this.trashedProducts[productIndex];
                
                // Remove deletedAt property
                delete product.deletedAt;
                
                // Add back to products
                this.products.push(product);
                this.saveProducts();
                
                // Remove from trash
                this.trashedProducts.splice(productIndex, 1);
                this.saveTrashedProducts();
                
                // Re-render
                this.renderTrashedProducts();
                
                // Update main menu
                this.updateMainMenu();
                
                Swal.fire(
                    'تم الاسترجاع!',
                    'تم استرجاع المنتج بنجاح.',
                    'success'
                );
            }
        }
    }
    
    async deleteProductPermanently(productId) {
        const result = await Swal.fire({
            title: 'حذف نهائي',
            text: 'هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء!',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، احذف نهائياً!',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            this.trashedProducts = this.trashedProducts.filter(p => p.id !== productId);
            this.saveTrashedProducts();
            this.renderTrashedProducts();

            Swal.fire(
                'تم الحذف!',
                'تم حذف المنتج نهائياً.',
                'success'
            );
        }
    }

    async restoreOrders(orderGroupId) {
        const result = await Swal.fire({
            title: 'استرجاع الطلبات',
            text: 'هل أنت متأكد من استرجاع هذه الطلبات؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، استرجع!',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            const orderGroupIndex = this.trashedOrders.findIndex(og => og.id === orderGroupId);
            if (orderGroupIndex !== -1) {
                const orderGroup = this.trashedOrders[orderGroupIndex];

                // Restore orders to active orders
                if (!this.orders[orderGroup.productName]) {
                    this.orders[orderGroup.productName] = { orders: [] };
                }

                // Remove deletedAt from orders and add them back
                orderGroup.orders.forEach(order => {
                    delete order.deletedAt;
                    this.orders[orderGroup.productName].orders.push(order);
                });

                this.saveOrders();

                // Remove from trash
                this.trashedOrders.splice(orderGroupIndex, 1);
                this.saveTrashedOrders();

                // Re-render
                this.renderTrashedProducts();

                // Update main menu
                this.updateMainMenu();

                Swal.fire(
                    'تم الاسترجاع!',
                    'تم استرجاع الطلبات بنجاح.',
                    'success'
                );
            }
        }
    }

    async deleteOrdersPermanently(orderGroupId) {
        const result = await Swal.fire({
            title: 'حذف نهائي',
            text: 'هل أنت متأكد من الحذف النهائي للطلبات؟ لا يمكن التراجع عن هذا الإجراء!',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، احذف نهائياً!',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            this.trashedOrders = this.trashedOrders.filter(og => og.id !== orderGroupId);
            this.saveTrashedOrders();
            this.renderTrashedProducts();

            Swal.fire(
                'تم الحذف!',
                'تم حذف الطلبات نهائياً.',
                'success'
            );
        }
    }
    
    async restoreAllProducts() {
        const totalItems = this.trashedProducts.length + this.trashedOrders.length;

        if (totalItems === 0) {
            Swal.fire({
                title: 'سلة المحذوفات فارغة',
                text: 'لا توجد منتجات أو طلبات لاسترجاعها',
                icon: 'info',
                confirmButtonText: 'موافق'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'استرجاع جميع العناصر',
            text: `هل أنت متأكد من استرجاع جميع العناصر (${this.trashedProducts.length} منتج، ${this.trashedOrders.length} مجموعة طلبات)؟`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، استرجع الكل!',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            // Restore all products
            this.trashedProducts.forEach(product => {
                delete product.deletedAt;
                this.products.push(product);
            });

            // Restore all orders
            this.trashedOrders.forEach(orderGroup => {
                if (!this.orders[orderGroup.productName]) {
                    this.orders[orderGroup.productName] = { orders: [] };
                }

                orderGroup.orders.forEach(order => {
                    delete order.deletedAt;
                    this.orders[orderGroup.productName].orders.push(order);
                });
            });

            this.saveProducts();
            this.saveOrders();
            this.trashedProducts = [];
            this.trashedOrders = [];
            this.saveTrashedProducts();
            this.saveTrashedOrders();
            this.renderTrashedProducts();
            this.updateMainMenu();

            Swal.fire(
                'تم الاسترجاع!',
                'تم استرجاع جميع العناصر بنجاح.',
                'success'
            );
        }
    }
    
    async emptyTrash() {
        const totalItems = this.trashedProducts.length + this.trashedOrders.length;

        if (totalItems === 0) {
            Swal.fire({
                title: 'سلة المحذوفات فارغة',
                text: 'لا توجد منتجات أو طلبات للحذف',
                icon: 'info',
                confirmButtonText: 'موافق'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'إفراغ سلة المحذوفات',
            text: `هل أنت متأكد من حذف جميع العناصر نهائياً (${this.trashedProducts.length} منتج، ${this.trashedOrders.length} مجموعة طلبات)؟ لا يمكن التراجع عن هذا الإجراء!`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، احذف نهائياً!',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            this.trashedProducts = [];
            this.trashedOrders = [];
            this.saveTrashedProducts();
            this.saveTrashedOrders();
            this.renderTrashedProducts();

            Swal.fire(
                'تم الحذف!',
                'تم إفراغ سلة المحذوفات بنجاح.',
                'success'
            );
        }
    }
    
    // Data persistence methods
    saveTrashedProducts() {
        localStorage.setItem('swy_trashed_products', JSON.stringify(this.trashedProducts));
    }
    
    loadTrashedProducts() {
        const saved = localStorage.getItem('swy_trashed_products');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveProducts() {
        localStorage.setItem('swy_products', JSON.stringify(this.products));
    }
    
    loadProducts() {
        const saved = localStorage.getItem('swy_products');
        return saved ? JSON.parse(saved) : [];
    }

    loadOrders() {
        const saved = localStorage.getItem('swy_orders');
        return saved ? JSON.parse(saved) : {};
    }

    saveOrders() {
        localStorage.setItem('swy_orders', JSON.stringify(this.orders));
    }

    loadTrashedOrders() {
        const saved = localStorage.getItem('swy_trashed_orders');
        return saved ? JSON.parse(saved) : [];
    }

    saveTrashedOrders() {
        localStorage.setItem('swy_trashed_orders', JSON.stringify(this.trashedOrders));
    }

    updateMainMenu() {
        // Trigger storage event to update main menu
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'swy_products',
            newValue: JSON.stringify(this.products)
        }));

        // Trigger storage event to update orders
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'swy_orders',
            newValue: JSON.stringify(this.orders)
        }));
    }
}

// Initialize trash manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.trashManager = new TrashManager();
});
