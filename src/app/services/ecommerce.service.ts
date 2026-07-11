// src/app/services/ecommerce.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';

// ============= INTERFACES =============
export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  avatar?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };
  storeName?: string;
  storeDescription?: string;
  isApproved?: boolean;
  createdAt: Date;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  seller: User | string;
  sellerName: string;
  origin?: string;  // Added for Benguet products
  rating: number;
  numReviews: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryStatus: 'preparing' | 'out_for_delivery' | 'delivered' | 'failed';
  trackingNumber: string;
  estimatedDelivery: Date;
  createdAt: Date;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EcommerceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api`;
  
  // ============= SIGNALS (State Management) =============
  currentUser = signal<User | null>(null);
  isLoggedIn = signal(false);
  isAdmin = signal(false);
  isSeller = signal(false);
  isBuyer = signal(false);
  cart = signal<Cart | null>(null);
  cartCount = signal(0);
  private token = signal<string | null>(null);
  
  constructor() {
    this.loadStoredData();
  }
  
  // ============= HELPER METHODS =============
  private loadStoredData(): void {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      this.token.set(storedToken);
      const userData: User = JSON.parse(storedUser);
      this.currentUser.set(userData);
      this.isLoggedIn.set(true);
      this.setUserRole(userData.role);
      this.getCart();
    }
  }
  
  private setUserRole(role: string): void {
    this.isAdmin.set(role === 'admin');
    this.isSeller.set(role === 'seller');
    this.isBuyer.set(role === 'buyer');
  }
  
  private getAuthHeaders(): { Authorization: string } {
    return { Authorization: `Bearer ${this.token()}` };
  }
  
  // ============= AUTH METHODS =============
  register(username: string, email: string, password: string, role: string) {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/register`, { 
      username, email, password, role 
    });
  }
  
  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/login`, { email, password });
  }
  
  logout(): void {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.isSeller.set(false);
    this.isBuyer.set(false);
    this.cart.set(null);
    this.cartCount.set(0);
    this.token.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  setAuthData(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
    this.setUserRole(user.role);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.getCart();
  }
  
  // ============= USER PROFILE =============
  getProfile() {
    return this.http.get<User>(`${this.apiUrl}/user/profile`, { headers: this.getAuthHeaders() });
  }
  
  updateProfile(data: Partial<User>) {
    return this.http.put<User>(`${this.apiUrl}/user/profile`, data, { headers: this.getAuthHeaders() });
  }
  
  // ============= CATEGORIES =============
  getCategories() {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }
  
  // ============= PRODUCTS (Buyer) =============
  getProducts(category?: string, search?: string, page: number = 1) {
    let url = `${this.apiUrl}/products?page=${page}&limit=20`;
    if (category && category !== 'all') url += `&category=${category}`;
    if (search) url += `&search=${search}`;
    return this.http.get<{ products: Product[]; totalPages: number; currentPage: number; total: number }>(url);
  }
  
  getProduct(id: string) {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }
  
  // ============= CART (Buyer) =============
  getCart(): void {
    if (!this.isLoggedIn()) return;
    this.http.get<Cart>(`${this.apiUrl}/cart`, { headers: this.getAuthHeaders() }).subscribe({
      next: (cart) => {
        this.cart.set(cart);
        const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartCount.set(count);
      },
      error: (err) => console.error('Error loading cart:', err)
    });
  }
  
  addToCart(productId: string, quantity: number = 1) {
    return this.http.post<Cart>(`${this.apiUrl}/cart/add`, { productId, quantity }, { headers: this.getAuthHeaders() });
  }
  
  updateCartItem(productId: string, quantity: number) {
    return this.http.put<Cart>(`${this.apiUrl}/cart/update/${productId}`, { quantity }, { headers: this.getAuthHeaders() });
  }
  
  removeFromCart(productId: string) {
    return this.http.delete<Cart>(`${this.apiUrl}/cart/remove/${productId}`, { headers: this.getAuthHeaders() });
  }
  
  // ============= ORDERS (Buyer) =============
// In ecommerce.service.ts
createOrder(shippingAddress: ShippingAddress, paymentMethod: string) {
  console.log('🛒🔴 SERVICE createOrder CALLED!');
  console.log('🛒🔴 This should appear in browser console!');
  console.log('📦 API URL:', `${this.apiUrl}/orders`);
  console.log('📦 Shipping:', shippingAddress);
  console.log('📦 Payment:', paymentMethod);
  console.log('📦 Creating order...');
  console.log('📦 API URL:', `${this.apiUrl}/orders`);
  console.log('📦 Shipping:', shippingAddress);
  console.log('📦 Payment:', paymentMethod);
  console.log('📦 Headers:', this.getAuthHeaders());
  
  return this.http.post<Order>(`${this.apiUrl}/orders`, 
    { shippingAddress, paymentMethod }, 
    { headers: this.getAuthHeaders() }
  );
}
  
  getOrders() {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { headers: this.getAuthHeaders() });
  }
  
  getOrder(id: string) {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`, { headers: this.getAuthHeaders() });
  }
  
  getOrderTracking(orderId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/orders/${orderId}/tracking`, { headers: this.getAuthHeaders() });
  }
  
  // ============= SELLER METHODS (FIXED) =============
  getSellerStats() {
    return this.http.get<any>(`${this.apiUrl}/seller/stats`, { headers: this.getAuthHeaders() });
  }
  
  getSellerProducts() {
    console.log('📦 Fetching seller products...');
    return this.http.get<Product[]>(`${this.apiUrl}/seller/products`, { headers: this.getAuthHeaders() });
  }
  
  addProduct(product: Partial<Product>) {
    console.log('➕ Adding product:', product);
    return this.http.post<Product>(`${this.apiUrl}/seller/products`, product, { headers: this.getAuthHeaders() });
  }
  
  // FIXED: Changed from /seller/products/:id to /products/:id
  updateProduct(id: string, product: Partial<Product>) {
    console.log(`✏️ Updating product ${id}:`, product);
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product, { headers: this.getAuthHeaders() });
  }
  
  // FIXED: Changed from /seller/products/:id to /products/:id
  deleteProduct(id: string) {
    console.log(`🗑️ Deleting product ${id}`);
    return this.http.delete(`${this.apiUrl}/products/${id}`, { headers: this.getAuthHeaders() });
  }
  
  // FIXED: Added proper logging for seller orders
  getSellerOrders() {
    console.log('📦 Fetching seller orders...');
    return this.http.get<Order[]>(`${this.apiUrl}/seller/orders`, { headers: this.getAuthHeaders() });
  }
  
  // FIXED: This method already exists but we're ensuring it's correct
  updateOrderStatus(orderId: string, orderStatus: string) {
    console.log(`📦 Updating order ${orderId} to status: ${orderStatus}`);
    return this.http.put<any>(
      `${this.apiUrl}/seller/orders/${orderId}/status`, 
      { orderStatus }, 
      { headers: this.getAuthHeaders() }
    );
  }
  
  // ============= ADMIN METHODS =============
  getAdminStats() {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`, { headers: this.getAuthHeaders() });
  }
  
  getAllUsers() {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`, { headers: this.getAuthHeaders() });
  }
  
  updateUserRole(userId: string, role: string, isApproved: boolean) {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/role`, { role, isApproved }, { headers: this.getAuthHeaders() });
  }
  
  getAllOrders() {
    return this.http.get<Order[]>(`${this.apiUrl}/admin/orders`, { headers: this.getAuthHeaders() });
  }
  
  addCategory(category: Partial<Category>) {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category, { headers: this.getAuthHeaders() });
  }
  
  deleteCategory(id: string) {
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { headers: this.getAuthHeaders() });
  }
}