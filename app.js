document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', function() {
        // إزالة النشاط من جميع الأزرار
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // إضافة النشاط للزر المحدد
        this.classList.add('active');
        
        // إخفاء جميع الأقسام
        document.querySelectorAll('.menu-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إظهار القسم المحدد
        const category = this.getAttribute('data-category');
        document.getElementById(category).classList.add('active');
    });
});

// تأثيرات إضافية عند التمرير
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.header');
    parallax.style.transform = `translateY(${scrolled * 0.4}px)`;
});

// Product Detail Modal Functionality
class ProductModal {
    constructor() {
        this.modal = document.getElementById('productDetailModal');
        this.productName = document.getElementById('productName');
        this.productIcon = document.getElementById('productIcon');
        this.quantityDisplay = document.getElementById('quantityDisplay');
        this.totalAmount = document.getElementById('totalAmount');
        this.sugarSection = document.getElementById('sugarSection');
        this.closeBtn = document.getElementById('closeModal');
        this.decreaseBtn = document.getElementById('decreaseBtn');
        this.increaseBtn = document.getElementById('increaseBtn');
        this.purchaseBtn = document.getElementById('purchaseBtn');

        this.currentProduct = null;
        this.quantity = 1;
        this.basePrice = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        // Close modal events
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());

        // Quantity controls
        this.decreaseBtn.addEventListener('click', () => this.decreaseQuantity());
        this.increaseBtn.addEventListener('click', () => this.increaseQuantity());

        // Purchase button
        this.purchaseBtn.addEventListener('click', () => this.handlePurchase());

        // Add button events for all menu items
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const product = e.target.closest('.add-btn').dataset.product;
                const price = parseFloat(e.target.closest('.add-btn').dataset.price);
                const category = e.target.closest('.add-btn').dataset.category;
                this.openModal(product, price, category);
            });
        });

        // Sugar option changes
        document.querySelectorAll('input[name="sugar"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateTotal());
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(productName, price, category) {
        this.currentProduct = { name: productName, price: price, category: category };
        this.basePrice = price;
        this.quantity = 1;

        // Set product details
        this.productName.textContent = productName;
        this.quantityDisplay.textContent = this.quantity;

        // Set appropriate icon based on category
        this.setProductIcon(category);

        // Show/hide sugar options for hot drinks
        if (category === 'hot-drinks') {
            this.sugarSection.classList.remove('hidden');
            // Reset sugar selection to "without sugar"
            document.querySelector('input[name="sugar"][value="0"]').checked = true;
        } else {
            this.sugarSection.classList.add('hidden');
        }

        // Update total and show modal
        this.updateTotal();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        this.currentProduct = null;
    }

    setProductIcon(category) {
        const iconMap = {
            'hot-drinks': 'fas fa-mug-hot',
            'cold-drinks': 'fas fa-glass-whiskey',
            'ice-cream': 'fas fa-ice-cream',
            'milkshake': 'fas fa-blender'
        };

        this.productIcon.className = iconMap[category] || 'fas fa-mug-hot';
    }

    decreaseQuantity() {
        if (this.quantity > 1) {
            this.quantity--;
            this.quantityDisplay.textContent = this.quantity;
            this.updateTotal();
        }
        this.updateQuantityButtons();
    }

    increaseQuantity() {
        if (this.quantity < 10) { // Max quantity limit
            this.quantity++;
            this.quantityDisplay.textContent = this.quantity;
            this.updateTotal();
        }
        this.updateQuantityButtons();
    }

    updateQuantityButtons() {
        this.decreaseBtn.disabled = this.quantity <= 1;
        this.increaseBtn.disabled = this.quantity >= 10;
    }

    updateTotal() {
        const total = this.basePrice * this.quantity;
        this.totalAmount.textContent = `${total} جنية`;
        this.updateQuantityButtons();
    }

    handlePurchase() {
        if (!this.currentProduct) return;

        const selectedSugar = !this.sugarSection.classList.contains('hidden')
            ? document.querySelector('input[name="sugar"]:checked').value
            : null;

        const orderDetails = {
            product: this.currentProduct.name,
            quantity: this.quantity,
            price: this.basePrice,
            total: this.basePrice * this.quantity,
            sugar: selectedSugar,
            category: this.currentProduct.category
        };

        // Show purchase confirmation
        this.showPurchaseConfirmation(orderDetails);
    }

    async showPurchaseConfirmation(orderDetails) {
        let sugarText = '';
        if (orderDetails.sugar !== null) {
            const sugarValue = parseFloat(orderDetails.sugar);
            if (sugarValue === 0) {
                sugarText = ' (بدون سكر)';
            } else {
                sugarText = ` (${sugarValue} ملعقة سكر)`;
            }
        }

        // Show order details form with table number and customer info
        const { value: formValues } = await Swal.fire({
            title: 'تأكيد الطلب',
            html: `
                <div class="order-confirmation-form">
                    <div class="order-summary mb-4">
                        <h5 class="text-primary mb-3">
                            <i class="fas fa-shopping-cart me-2"></i>
                            تفاصيل الطلب
                        </h5>
                        <div class="order-item-details">
                            <p><strong>المنتج:</strong> ${orderDetails.product}${sugarText}</p>
                            <p><strong>الكمية:</strong> ${orderDetails.quantity}</p>
                            <p><strong>السعر الإجمالي:</strong> ${orderDetails.total} جنية</p>
                        </div>
                    </div>

                    <div class="customer-info">
                        <h6 class="text-secondary mb-3">
                            <i class="fas fa-user me-2"></i>
                            معلومات العميل
                        </h6>
                        <div class="form-group mb-3">
                            <label for="tableNumber" class="form-label">رقم الطاولة *</label>
                            <input type="number"
                                    id="tableNumber"
                                    class="form-control"
                                    placeholder="أدخل رقم الطاولة"
                                    min="1"
                                    max="50"
                                    required>
                        </div>
                        <div class="form-group">
                            <label for="customerName" class="form-label">اسم العميل (اختياري)</label>
                            <input type="text"
                                    id="customerName"
                                    class="form-control"
                                    placeholder="أدخل اسم العميل">
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تأكيد الطلب <i class="fas fa-check ms-2"></i>',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            width: '500px',
            preConfirm: () => {
                const tableNumber = document.getElementById('tableNumber').value;
                const customerName = document.getElementById('customerName').value;

                if (!tableNumber) {
                    Swal.showValidationMessage('يرجى إدخال رقم الطاولة');
                    return false;
                }

                if (tableNumber < 1 || tableNumber > 50) {
                    Swal.showValidationMessage('رقم الطاولة يجب أن يكون بين 1 و 50');
                    return false;
                }

                return {
                    tableNumber: parseInt(tableNumber),
                    customerName: customerName.trim() || null
                };
            }
        });

        if (formValues) {
            // Generate customer ID
            const customerId = this.generateCustomerId();

            // Add customer info to order details
            const completeOrderDetails = {
                ...orderDetails,
                tableNumber: formValues.tableNumber,
                customerName: formValues.customerName,
                customerId: customerId
            };

            // Add order to admin system
            this.addOrderToAdmin(completeOrderDetails);

            // Show success message
            await Swal.fire({
                title: 'تم تأكيد الطلب!',
                html: `
                    <div class="success-order-details">
                        <div class="mb-3">
                            <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                        </div>
                        <p><strong>رقم العميل:</strong> ${customerId}</p>
                        <p><strong>رقم الطاولة:</strong> ${formValues.tableNumber}</p>
                        ${formValues.customerName ? `<p><strong>اسم العميل:</strong> ${formValues.customerName}</p>` : ''}
                        <p><strong>المنتج:</strong> ${orderDetails.product}${sugarText}</p>
                        <p><strong>الكمية:</strong> ${orderDetails.quantity}</p>
                        <p><strong>المجموع:</strong> ${orderDetails.total} جنية</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'موافق',
                confirmButtonColor: '#28a745'
            });

            this.closeModal();
        }
    }

    generateCustomerId() {
        // Generate a unique customer ID based on timestamp and random number
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `C${timestamp}${random}`;
    }

    addOrderToAdmin(orderDetails) {
        // Get existing orders from localStorage
        let orders = {};
        const savedOrders = localStorage.getItem('swy_orders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders);
        }

        const productName = orderDetails.product;

        // Initialize product orders if doesn't exist
        if (!orders[productName]) {
            orders[productName] = {
                orders: []
            };
        }

        // Add new order
        orders[productName].orders.push({
            ...orderDetails,
            completed: false,
            timestamp: new Date().toISOString()
        });

        // Update product order count
        this.updateProductOrderCount(productName);

        // Save back to localStorage
        localStorage.setItem('swy_orders', JSON.stringify(orders));
    }

    updateProductOrderCount(productName) {
        const savedProducts = localStorage.getItem('swy_products');
        if (savedProducts) {
            const products = JSON.parse(savedProducts);
            const product = products.find(p => p.name === productName);
            if (product) {
                product.orderCount = (product.orderCount || 0) + 1;
                localStorage.setItem('swy_products', JSON.stringify(products));

                // Trigger menu refresh to update badges
                if (window.menuManager) {
                    window.menuManager.refreshMenu();
                }
            }
        }
    }
}

// Dynamic Menu Management
class MenuManager {
    constructor() {
        this.loadDynamicProducts();
    }

    loadDynamicProducts() {
        const savedProducts = localStorage.getItem('swy_products');
        if (savedProducts) {
            const products = JSON.parse(savedProducts);
            this.addProductsToMenu(products);
        }
    }

    addProductsToMenu(products) {

        // Group products by category
        const productsByCategory = {};
        products.forEach(product => {
            if (!productsByCategory[product.category]) {
                productsByCategory[product.category] = [];
            }
            productsByCategory[product.category].push(product);
        });

        // Add products to each category section
        Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
            const section = document.getElementById(category);
            if (section) {
                const menuGrid = section.querySelector('.menu-grid');

                categoryProducts.forEach(product => {
                    const badges = this.getProductBadges(product);
                    const badgesHTML = badges.map(badge =>
                        `<div class="item-badge ${badge.class}">${badge.text}</div>`
                    ).join('');

                    // Determine image to display
                    const imageHTML = product.image
                        ? `<img src="${product.image}" alt="${product.name}" class="product-image">`
                        : `<i class="fas fa-mug-hot"></i>`;
                    const productHTML = `
                        <div class="menu-item dynamic-product" data-product-id="${product.id}">
                            <div class="item-image">
                                ${imageHTML}
                                ${badgesHTML}
                            </div>
                            <div class="item-info">
                                <div class="item-name">
                                    <span>${product.name}</span>
                                    <span class="item-price">${product.price} جنية</span>
                                </div>
                                <p class="item-description">${product.description}</p>
                                <div class="item-meta">
                                    <span class="item-rating">
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </span>
                                    <button type="button" class="add-btn" data-product="${product.name}" data-price="${product.price}" data-category="${product.category}">
                                        <i class="fas fa-plus"></i> إضافة
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                    menuGrid.insertAdjacentHTML('beforeend', productHTML);
                });
            }
        });

        // Re-initialize event listeners for new buttons
        this.initNewProductButtons();
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
        const ordersPerDay = (product.orderCount || 0) / Math.max(daysSinceCreated, 1);
        if ((product.orderCount || 0) >= 50 && ordersPerDay >= 50) {
            // Check if it's been more than 2 days since reaching 50 orders
            const orders = JSON.parse(localStorage.getItem('swy_orders') || '{}');
            const ordersData = orders[product.name];
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

    initNewProductButtons() {
        document.querySelectorAll('.dynamic-product .add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const product = e.target.closest('.add-btn').dataset.product;
                const price = parseFloat(e.target.closest('.add-btn').dataset.price);
                const category = e.target.closest('.add-btn').dataset.category;

                if (window.productModal) {
                    window.productModal.openModal(product, price, category);
                }
            });
        });
    }

    removeProductFromMenu(productId) {
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement) {
            productElement.remove();
        }
    }

    refreshMenu() {
        // Remove all dynamic products
        document.querySelectorAll('.dynamic-product').forEach(el => el.remove());

        // Reload products
        this.loadDynamicProducts();
    }
}

// Admin password protection
// function promptAdminPassword() {
//     const password = prompt('أدخل كلمة مرور الإدارة:');
//     const adminPassword = 'admin123'; // You can change this password

//     if (password === adminPassword) {
//         window.location.href = 'admin.html';
//     } else if (password !== null) { // User didn't cancel
//         alert('كلمة المرور غير صحيحة!');
//     }
// }
function promptAdminPassword() {
    Swal.fire({
        title: 'الدخول إلى لوحة الإدارة',
        html: `
            <div class="text-center">
                <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                <p class="text-muted">يرجى إدخال كلمة مرور المسؤول للمتابعة</p>
                <input type="password" 
                        id="adminPassword" 
                        class="form-control text-center" 
                        placeholder="كلمة مرور الإدارة"
                        style="font-size: 18px; padding: 15px;">
            </div>
        `,
        backdrop: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: 'دخول <i class="fas fa-sign-in-alt ms-2"></i>',
        confirmButtonColor: '#3085d6',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        cancelButtonColor: '#d33',
        preConfirm: () => {
            const password = document.getElementById('adminPassword').value;
            const adminPassword = 'admin123';
            
            if (!password) {
                Swal.showValidationMessage('يرجى إدخال كلمة المرور');
                return false;
            }
            
            if (password !== adminPassword) {
                Swal.showValidationMessage('كلمة المرور غير صحيحة');
                return false;
            }
            
            return password;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = 'admin.html';
        }
    });
}

// Offers Management
class OffersManager {
    constructor() {
        this.loadOffers();
    }

    loadOffers() {
        const savedOffers = localStorage.getItem('swy_offers');
        if (savedOffers) {
            const offers = JSON.parse(savedOffers);
            this.displayOffers(offers);
        }
    }

    displayOffers(offers) {
        const offersSection = document.getElementById('offersSection');

        // Filter active and non-expired offers
        const activeOffers = offers.filter(offer => {
            return offer.active && new Date(offer.validUntil) >= new Date();
        });

        if (activeOffers.length === 0) {
            offersSection.style.display = 'none';
            return;
        }

        offersSection.style.display = 'block';
        offersSection.innerHTML = activeOffers.map(offer => `
            <div class="special-offer">
                <h3><i class="fas fa-gift me-2"></i>${offer.title}</h3>
                <p>${offer.description}</p>
                <div class="offer-details">
                    <span class="offer-discount">${offer.discount}% خصم</span>
                    <span class="offer-validity">صالح حتى: ${new Date(offer.validUntil).toLocaleDateString('ar-EG')}</span>
                </div>
            </div>
        `).join('');
    }

    refreshOffers() {
        this.loadOffers();
    }
}

// Initialize the modal and menu manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.productModal = new ProductModal();
    window.menuManager = new MenuManager();
    window.offersManager = new OffersManager();

    // Listen for storage changes to update menu when admin adds/removes products
    window.addEventListener('storage', function(e) {
        if (e.key === 'swy_products') {
            window.menuManager.refreshMenu();
        } else if (e.key === 'swy_offers') {
            window.offersManager.refreshOffers();
        }
    });
});