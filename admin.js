// Admin Panel Management System
class AdminPanel {
    constructor() {
        this.products = this.loadProducts();
        this.orders = this.loadOrders();
        this.offers = this.loadOffers();
        this.currentTab = 'add-products';
        this.refreshInterval = null;

        this.initEventListeners();
        this.renderCurrentProducts();
        this.renderOrders();
        this.renderOffers();
        this.updateOrdersSummary();
        this.startAutoRefresh();
    }
    
    initEventListeners() {
        // Tab navigation
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.closest('.admin-tab-btn').dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Product form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Offer form submission
        document.getElementById('offerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addOffer();
        });

        // Delete all orders
        document.getElementById('deleteAllOrdersBtn').addEventListener('click', () => {
            this.deleteAllOrders();
        });

        // Manual refresh button
        document.getElementById('manualRefreshBtn').addEventListener('click', () => {
            this.manualRefresh();
        });

        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'swy_orders' || e.key === 'swy_products') {
                this.handleStorageChange(e.key);
            }
        });

        // Listen for visibility change to refresh when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshData();
            }
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Refresh data when switching tabs
        if (tabName === 'manage-orders') {
            this.renderOrders();
            this.updateOrdersSummary();
        } else if (tabName === 'manage-offers') {
            this.renderOffers();
        }
    }
    
    addProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const product = {
            id: Date.now().toString(),
            category: formData.get('category'),
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            createdAt: new Date().toISOString(),
            orderCount: 0
        };
        
        // Add to products array
        this.products.push(product);
        this.saveProducts();
        
        // Clear form
        form.reset();
        
        // Re-render products
        this.renderCurrentProducts();
        
        // Show success message
        this.showNotification('تم إضافة المنتج بنجاح!', 'success');
        
        // Update main menu if it exists
        this.updateMainMenu();
    }
    
    deleteProduct(productId) {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderCurrentProducts();
            this.updateMainMenu();
            this.showNotification('تم حذف المنتج بنجاح!', 'success');
        }
    }
    
    renderCurrentProducts() {
        const grid = document.getElementById('currentProductsGrid');
        
        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>لا توجد منتجات</h3>
                    <p>قم بإضافة منتجات جديدة باستخدام النموذج أعلاه</p>
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
        
        grid.innerHTML = this.products.map(product => {
            const badges = this.getProductBadges(product);
            const badgesHTML = badges.map(badge =>
                `<span class="product-badge ${badge.class}">${badge.text}</span>`
            ).join('');

            return `
                <div class="product-card">
                    <div class="product-card-header">
                        <span class="product-category">${categoryNames[product.category]}</span>
                        <button type="button" class="delete-product-btn" onclick="adminPanel.deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="product-badges">${badgesHTML}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">${product.price} جنية</div>
                    <div class="product-stats">
                        <small>الطلبات: ${product.orderCount || 0}</small>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderOrders() {
        const container = document.getElementById('ordersContainer');
        
        if (Object.keys(this.orders).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>لا توجد طلبات</h3>
                    <p>ستظهر الطلبات هنا عندما يقوم العملاء بالشراء</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = Object.entries(this.orders).map(([productName, orderData]) => {
            const pendingOrders = orderData.orders.filter(order => !order.completed);
            const completedOrders = orderData.orders.filter(order => order.completed);
            const allCompleted = pendingOrders.length === 0;
            
            return `
                <div class="order-group">
                    <div class="order-group-header">
                        <div class="order-product-name">${productName}</div>
                        <div class="order-actions">
                            <span class="order-count">${pendingOrders.length}</span>
                            <button type="button" class="complete-all-btn ${allCompleted ? 'completed' : ''}" 
                                    onclick="adminPanel.completeAllOrders('${productName}')"
                                    ${allCompleted ? 'disabled' : ''}>
                                ${allCompleted ? 'مكتمل' : 'إكمال الكل'}
                            </button>
                            <div class="completed-count">
                                <span>مكتمل: ${completedOrders.length}</span>
                            </div>
                            <button type="button" class="delete-product-btn" onclick="${completedOrders.length === 0 ? `adminPanel.deleteProductOrders('${productName}')` : `alert('لا يمكن حذف الطلبات المكتملة.')`}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="order-items">
                        ${orderData.orders.map((order, index) => `
                            <div class="order-item">
                                <div class="order-details">
                                    <div class="order-number">${index + 1}</div>
                                    <div class="order-info">
                                        ${order.quantity} × ${productName}
                                        ${order.sugar !== null ? ` (${this.getSugarText(order.sugar)})` : ''}
                                        - ${order.total} جنية
                                    </div>
                                </div>
                                <div class="order-item-actions">
                                    <button type="button" class="complete-order-btn ${order.completed ? 'completed' : ''}" 
                                            onclick="adminPanel.toggleOrderStatus('${productName}', ${index})"
                                            ${order.completed ? 'disabled' : ''}>
                                        ${order.completed ? 'مكتمل' : 'إكمال'}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getSugarText(sugarValue) {
        const sugar = parseFloat(sugarValue);
        if (sugar === 0) return 'بدون سكر';
        return `${sugar} ملعقة سكر`;
    }
    
    toggleOrderStatus(productName, orderIndex) {
        if (this.orders[productName] && this.orders[productName].orders[orderIndex]) {
            this.orders[productName].orders[orderIndex].completed = true;
            this.saveOrders();
            this.renderOrders();
            this.updateOrdersSummary();
            this.showNotification('تم إكمال الطلب!', 'success');
        }
    }
    
    completeAllOrders(productName) {
        if (this.orders[productName]) {
            this.orders[productName].orders.forEach(order => {
                order.completed = true;
            });
            this.saveOrders();
            this.renderOrders();
            this.updateOrdersSummary();
            this.showNotification(`تم إكمال جميع طلبات ${productName}!`, 'success');
        }
    }
    
    deleteProductOrders(productName) {
        if (confirm(`هل أنت متأكد من حذف جميع طلبات ${productName}؟`)) {
            delete this.orders[productName];
            this.saveOrders();
            this.renderOrders();
            this.updateOrdersSummary();
            this.showNotification('تم حذف الطلبات بنجاح!', 'success');
        }
    }
    
    // deleteAllOrders() {
    //     // First password confirmation
    //     const password = prompt('أدخل كلمة مرور الإدارة لحذف جميع البيانات:');
    //     const adminPassword = 'admin123'; // Same password as main page

    //     if (password !== adminPassword) {
    //         if (password !== null) { // User didn't cancel
    //             alert('كلمة المرور غير صحيحة!');
    //         }
    //         return;
    //     }

    //     // Second confirmation after password
    //     if (confirm('هل أنت متأكد من حذف جميع الطلبات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
    //         this.orders = {};
    //         this.saveOrders();
    //         this.renderOrders();
    //         this.updateOrdersSummary();
    //         this.showNotification('تم حذف جميع الطلبات!', 'success');
    //     }
    // }
    async deleteAllOrders() {
        // طلب كلمة المرور
        const { value: password } = await Swal.fire({
            title: 'حذف جميع الطلبات',
            input: 'password',
            inputLabel: 'كلمة مرور الإدارة',
            inputPlaceholder: 'أدخل كلمة المرور',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'متابعة',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#d33',
            preConfirm: (password) => {
                if (!password) {
                    Swal.showValidationMessage('يرجى إدخال كلمة المرور');
                } else if (password !== 'admin123') {
                    Swal.showValidationMessage('كلمة المرور غير صحيحة');
                }
                return password;
            }
        });

        if (!password) return;

        // التأكيد النهائي
        const { isConfirmed } = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'سيتم حذف جميع الطلبات ولا يمكن التراجع عن هذا الإجراء!',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف الكل!',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        });

        if (isConfirmed) {
            this.orders = {};
            this.saveOrders();
            this.renderOrders();
            this.updateOrdersSummary();
            
            Swal.fire(
                'تم الحذف!',
                'تم حذف جميع الطلبات بنجاح.',
                'success'
            );
        }
    }
    
    updateOrdersSummary() {
        let totalOrders = 0;
        let completedOrders = 0;
        let totalSales = 0;
        
        Object.values(this.orders).forEach(orderData => {
            orderData.orders.forEach(order => {
                totalOrders++;
                totalSales += order.total;
                if (order.completed) {
                    completedOrders++;
                }
            });
        });
        
        document.getElementById('totalOrdersCount').textContent = totalOrders;
        document.getElementById('completedOrdersCount').textContent = completedOrders;
        document.getElementById('totalSalesAmount').textContent = `${totalSales} جنية`;
    }
    
    addOrder(orderDetails) {
        const productName = orderDetails.product;

        if (!this.orders[productName]) {
            this.orders[productName] = {
                orders: []
            };
        }

        this.orders[productName].orders.push({
            ...orderDetails,
            completed: false,
            timestamp: new Date().toISOString()
        });

        // Update product order count
        this.updateProductOrderCount(productName);

        this.saveOrders();

        // Update UI if on orders tab
        if (this.currentTab === 'manage-orders') {
            this.renderOrders();
            this.updateOrdersSummary();
        }
    }

    updateProductOrderCount(productName) {
        const product = this.products.find(p => p.name === productName);
        if (product) {
            product.orderCount = (product.orderCount || 0) + 1;
            this.saveProducts();
            this.updateMainMenu();
        }
    }

    getProductBadges(product) {
        const badges = [];
        const now = new Date();
        const createdAt = new Date(product.createdAt);
        const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);

        // "New" badge for products created within the last day
        if (daysSinceCreated <= 1) {
            badges.push({ type: 'new', text: 'جديد', class: 'badge-new' });
        }

        // "Most Requested" badge for products with 50+ orders per day
        const ordersPerDay = product.orderCount / Math.max(daysSinceCreated, 1);
        if (product.orderCount >= 50 && ordersPerDay >= 50) {
            // Check if it's been more than 2 days since reaching 50 orders
            const ordersData = this.orders[product.name];
            if (ordersData && ordersData.orders.length >= 50) {
                const firstHighOrderDate = new Date(ordersData.orders[49].timestamp);
                const daysSinceHighOrders = (now - firstHighOrderDate) / (1000 * 60 * 60 * 24);

                if (daysSinceHighOrders <= 2) {
                    badges.push({ type: 'popular', text: 'الأكثر طلباً', class: 'badge-popular' });
                }
            }
        }

        return badges;
    }

    addOffer() {
        const form = document.getElementById('offerForm');
        const formData = new FormData(form);

        const offer = {
            id: Date.now().toString(),
            title: formData.get('title'),
            description: formData.get('description'),
            discount: parseInt(formData.get('discount')),
            validUntil: formData.get('validUntil'),
            active: formData.get('active') === 'true',
            createdAt: new Date().toISOString()
        };

        // Add to offers array
        this.offers.push(offer);
        this.saveOffers();

        // Clear form
        form.reset();

        // Re-render offers
        this.renderOffers();

        // Show success message
        this.showNotification('تم إضافة العرض بنجاح!', 'success');

        // Update main menu
        this.updateMainMenu();
    }

    deleteOffer(offerId) {
        if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
            this.offers = this.offers.filter(o => o.id !== offerId);
            this.saveOffers();
            this.renderOffers();
            this.updateMainMenu();
            this.showNotification('تم حذف العرض بنجاح!', 'success');
        }
    }

    toggleOfferStatus(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (offer) {
            offer.active = !offer.active;
            this.saveOffers();
            this.renderOffers();
            this.updateMainMenu();
            this.showNotification(`تم ${offer.active ? 'تفعيل' : 'إلغاء'} العرض!`, 'success');
        }
    }

    renderOffers() {
        const grid = document.getElementById('currentOffersGrid');

        if (this.offers.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>لا توجد عروض</h3>
                    <p>قم بإضافة عروض جديدة باستخدام النموذج أعلاه</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.offers.map(offer => {
            const isExpired = new Date(offer.validUntil) < new Date();
            const statusClass = offer.active && !isExpired ? 'active' : 'inactive';
            const statusText = isExpired ? 'منتهي الصلاحية' : (offer.active ? 'نشط' : 'غير نشط');

            return `
                <div class="offer-card ${statusClass}">
                    <div class="offer-card-header">
                        <span class="offer-status ${statusClass}">${statusText}</span>
                        <div class="offer-actions">
                            <button type="button" class="toggle-offer-btn" onclick="adminPanel.toggleOfferStatus('${offer.id}')" ${isExpired ? 'disabled' : ''}>
                                <i class="fas ${offer.active ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <button type="button" class="delete-offer-btn" onclick="adminPanel.deleteOffer('${offer.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="offer-title">${offer.title}</div>
                    <div class="offer-description">${offer.description}</div>
                    <div class="offer-discount">${offer.discount}% خصم</div>
                    <div class="offer-validity">صالح حتى: ${new Date(offer.validUntil).toLocaleDateString('ar-EG')}</div>
                </div>
            `;
        }).join('');
    }

    updateMainMenu() {
        // Trigger storage event to update main menu
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'swy_products',
            newValue: JSON.stringify(this.products)
        }));

        // Also trigger offers update
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'swy_offers',
            newValue: JSON.stringify(this.offers)
        }));
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Data persistence methods
    saveProducts() {
        localStorage.setItem('swy_products', JSON.stringify(this.products));
    }
    
    loadProducts() {
        const saved = localStorage.getItem('swy_products');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveOrders() {
        localStorage.setItem('swy_orders', JSON.stringify(this.orders));
    }
    
    loadOrders() {
        const saved = localStorage.getItem('swy_orders');
        return saved ? JSON.parse(saved) : {};
    }

    saveOffers() {
        localStorage.setItem('swy_offers', JSON.stringify(this.offers));
    }

    loadOffers() {
        const saved = localStorage.getItem('swy_offers');
        return saved ? JSON.parse(saved) : [];
    }

    // Auto-refresh functionality
    startAutoRefresh() {
        // Refresh every 2 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 2000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    refreshData() {
        const newOrders = this.loadOrders();
        const newProducts = this.loadProducts();

        // Check if orders have changed
        if (JSON.stringify(newOrders) !== JSON.stringify(this.orders)) {
            this.orders = newOrders;
            if (this.currentTab === 'manage-orders') {
                this.renderOrders();
                this.updateOrdersSummary();
            }
        }

        // Check if products have changed
        if (JSON.stringify(newProducts) !== JSON.stringify(this.products)) {
            this.products = newProducts;
            if (this.currentTab === 'add-products') {
                this.renderCurrentProducts();
            }
        }
    }

    manualRefresh() {
        const refreshBtn = document.getElementById('manualRefreshBtn');

        // Add spinning animation
        refreshBtn.classList.add('spinning');

        // Force refresh all data
        this.orders = this.loadOrders();
        this.products = this.loadProducts();

        // Re-render current tab
        if (this.currentTab === 'manage-orders') {
            this.renderOrders();
            this.updateOrdersSummary();
        } else if (this.currentTab === 'add-products') {
            this.renderCurrentProducts();
        }

        // Show notification
        this.showNotification('تم تحديث البيانات بنجاح!', 'success');

        // Remove spinning animation after 1 second
        setTimeout(() => {
            refreshBtn.classList.remove('spinning');
        }, 1000);
    }

    handleStorageChange(key) {
        if (key === 'swy_orders') {
            this.orders = this.loadOrders();
            if (this.currentTab === 'manage-orders') {
                this.renderOrders();
                this.updateOrdersSummary();
            }
        } else if (key === 'swy_products') {
            this.products = this.loadProducts();
            if (this.currentTab === 'add-products') {
                this.renderCurrentProducts();
            }
        }
    }

    // Clean up when page is unloaded
    destroy() {
        this.stopAutoRefresh();
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminPanel) {
        window.adminPanel.destroy();
    }
});

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminPanel = new AdminPanel();
});
