// script.js - Frontend JavaScript
const API_URL = 'http://localhost:3000/api';

// ============ AUTH FUNCTIONS ============

// Register
async function registerUser(event) {
    if (event) event.preventDefault();
    
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        role: document.getElementById('regRole').value
    };
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Registration successful!');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = data.user.role === 'seller' ? 'seller-dashboard.html' : 'index.html';
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Login
async function loginUser(event) {
    if (event) event.preventDefault();
    
    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Welcome back!');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = data.user.role === 'seller' ? 'seller-dashboard.html' : 'index.html';
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Logged out!');
    window.location.href = 'index.html';
}

// Check if logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    return !!(token && user);
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ============ PRODUCT FUNCTIONS ============

// Get all products
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        const container = document.getElementById('allProducts');
        if (!container) return;
        
        if (data.products && data.products.length > 0) {
            container.innerHTML = data.products.map(product => `
                <div class="product-card">
                    <h3>${product.name}</h3>
                    <p>₱${product.price}</p>
                    <p>📍 ${product.origin || 'Benguet'}</p>
                    <p><small>Seller: ${product.sellerName || 'Benguet Seller'}</small></p>
                    <p>📦 Stock: ${product.stock}</p>
                    <button onclick="addToCart('${product._id}')">🛒 Add to Cart</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No products available. Be the first seller!</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Add product (seller)
async function addProduct(event) {
    if (event) event.preventDefault();
    
    if (!checkAuth()) {
        alert('Please login as seller first!');
        return;
    }
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseInt(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        origin: document.getElementById('productOrigin').value || 'Benguet'
    };
    
    try {
        const response = await fetch(`${API_URL}/seller/products`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Product added successfully!');
            document.getElementById('productForm').reset();
            loadSellerProducts();
            loadSellerOrders();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Load seller's products
async function loadSellerProducts() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/seller/products`, {
            headers: getAuthHeaders()
        });
        
        const products = await response.json();
        const container = document.getElementById('sellerProducts');
        if (!container) return;
        
        if (products.length > 0) {
            container.innerHTML = products.map(product => `
                <div class="product-card">
                    <strong>${product.name}</strong><br>
                    ₱${product.price} - ${product.origin || 'Benguet'}<br>
                    <small>${product.category}</small><br>
                    📦 Stock: ${product.stock}
                    <button onclick="deleteProduct('${product._id}')">❌ Delete</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>📦 No products added yet.</p>';
        }
    } catch (error) {
        console.error('Error loading seller products:', error);
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Remove this product?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('✅ Product deleted!');
            loadSellerProducts();
        } else {
            const data = await response.json();
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ============ CART FUNCTIONS ============

// Add to cart
async function addToCart(productId) {
    if (!checkAuth()) {
        alert('Please login first!');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, quantity: 1 })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Added to cart!');
            updateCartCount();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Load cart
async function loadCart() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: getAuthHeaders()
        });
        
        const cart = await response.json();
        const container = document.getElementById('cartItems');
        if (!container) return;
        
        if (cart.items && cart.items.length > 0) {
            let total = 0;
            container.innerHTML = cart.items.map(item => {
                const subtotal = item.product.price * item.quantity;
                total += subtotal;
                return `
                    <div class="cart-item">
                        <strong>${item.product.name}</strong> - ₱${item.product.price} x ${item.quantity} = ₱${subtotal}
                        <br><small>Seller: ${item.product.seller?.username || 'Benguet Seller'}</small>
                        <button onclick="updateCartItem('${item.product._id}', ${item.quantity - 1})">➖</button>
                        <button onclick="updateCartItem('${item.product._id}', ${item.quantity + 1})">➕</button>
                        <button onclick="removeFromCart('${item.product._id}')">❌</button>
                    </div>
                `;
            }).join('');
            
            document.getElementById('cartTotal').innerText = total;
        } else {
            container.innerHTML = '<p>🛒 Your cart is empty.</p>';
            document.getElementById('cartTotal').innerText = '0';
        }
        
        updateCartCount();
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Update cart item quantity
async function updateCartItem(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    try {
        await fetch(`${API_URL}/cart/update/${productId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ quantity })
        });
        loadCart();
    } catch (error) {
        console.error('Error updating cart:', error);
    }
}

// Remove from cart
async function removeFromCart(productId) {
    try {
        await fetch(`${API_URL}/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        loadCart();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

// Update cart count
async function updateCartCount() {
    if (!checkAuth()) {
        const countElem = document.getElementById('cartCount');
        if (countElem) countElem.innerText = '0';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: getAuthHeaders()
        });
        const cart = await response.json();
        const count = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        const countElem = document.getElementById('cartCount');
        if (countElem) countElem.innerText = count;
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Place order
async function placeOrder() {
    if (!checkAuth()) {
        alert('Please login first!');
        return;
    }
    
    const shippingAddress = {
        fullName: prompt('Full Name:'),
        street: prompt('Street Address:'),
        city: prompt('City:'),
        province: 'Benguet',
        zipCode: prompt('ZIP Code:'),
        phone: prompt('Phone Number:')
    };
    
    if (!shippingAddress.fullName || !shippingAddress.street) {
        alert('Shipping address is required!');
        return;
    }
    
    const paymentMethod = confirm('Pay on delivery? Click OK for COD, Cancel for Online') ? 'cod' : 'online';
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ shippingAddress, paymentMethod })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Order placed successfully!');
            window.location.href = 'index.html';
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ============ SELLER ORDER FUNCTIONS ============

// Load seller orders
async function loadSellerOrders() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/seller/orders`, {
            headers: getAuthHeaders()
        });
        
        const orders = await response.json();
        const container = document.getElementById('sellerOrders');
        if (!container) return;
        
        if (orders && orders.length > 0) {
            container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <h4>Order #${order.orderNumber}</h4>
                    <p><strong>Buyer:</strong> ${order.user?.username || 'Guest'}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span class="status-${order.orderStatus}">${order.orderStatus}</span></p>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                ${item.name} x ${item.quantity} = ₱${item.price * item.quantity}
                            </div>
                        `).join('')}
                    </div>
                    <p><strong>Total:</strong> ₱${order.totalAmount}</p>
                    <select onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>📭 No orders yet.</p>';
        }
    } catch (error) {
        console.error('Error loading seller orders:', error);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/seller/orders/${orderId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderStatus: newStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Order status updated!');
            loadSellerOrders();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ============ INITIALIZE ============

document.addEventListener('DOMContentLoaded', () => {
    // Show current user
    const user = JSON.parse(localStorage.getItem('user'));
    const userDisplay = document.getElementById('currentUser');
    if (userDisplay && user) {
        userDisplay.innerText = `👤 ${user.username} (${user.role})`;
    }
    
    // Load data
    loadProducts();
    loadCart();
    loadSellerProducts();
    loadSellerOrders();
    updateCartCount();
    
    // Forms
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', registerUser);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
    
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', addProduct);
    }
});