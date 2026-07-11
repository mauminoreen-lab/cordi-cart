import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EcommerceService, Product, Order } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>🏪 Seller Dashboard</h1>
        <p>Welcome, {{ ecommerceService.currentUser()?.username }}!</p>
        <p style="font-size: 14px; opacity: 0.8;">Seller ID: {{ ecommerceService.currentUser()?._id }}</p>
      </div>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>{{ stats.totalProducts }}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛒</div>
          <div class="stat-info">
            <h3>{{ stats.totalOrders }}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>₱{{ stats.totalSales.toLocaleString() }}</h3>
            <p>Total Sales</p>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <h3>{{ stats.lowStock }}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>
      </div>
      
      <!-- Tabs with Refresh Buttons -->
      <div class="tabs">
        <button [class.active]="activeTab === 'products'" (click)="setActiveTab('products')">My Products</button>
        <button [class.active]="activeTab === 'orders'" (click)="setActiveTab('orders')">
          Orders
          @if (newOrderCount > 0) {
            <span class="badge">{{ newOrderCount }}</span>
          }
        </button>
        <button [class.active]="activeTab === 'add'" (click)="setActiveTab('add')">Add Product</button>
      </div>
      
      <!-- Products Tab -->
      @if (activeTab === 'products') {
        <div class="products-section">
          <div class="section-header">
            <h3>My Products ({{ products.length }})</h3>
            <button (click)="loadProducts()" class="refresh-btn" [disabled]="loadingProducts">
              {{ loadingProducts ? 'Loading...' : '🔄 Refresh' }}
            </button>
          </div>
          <div class="products-grid">
            @for (product of products; track product._id) {
              <div class="product-card">
                <div class="product-images">
                  @if (product.images && product.images.length > 0) {
                    <img [src]="product.images[0]" [alt]="product.name">
                  } @else {
                    <img src="https://via.placeholder.com/200" alt="No image">
                  }
                </div>
                <div class="product-info">
                  <h3>{{ product.name }}</h3>
                  <p class="price">₱{{ product.price.toLocaleString() }}</p>
                  <p class="stock">Stock: {{ product.stock }}</p>
                  <p class="category">{{ product.category }}</p>
                  <p class="origin" style="font-size: 12px; color: #999;">📍 {{ product.origin || 'Benguet' }}</p>
                </div>
                <div class="product-actions">
                  <button (click)="editProduct(product)" class="edit-btn">✏️ Edit</button>
                  <button (click)="deleteProduct(product._id)" class="delete-btn">🗑️ Delete</button>
                </div>
              </div>
            }
            @if (products.length === 0 && !loadingProducts) {
              <div class="no-products">No products yet. Add your first product!</div>
            }
            @if (loadingProducts) {
              <div class="loading">Loading products...</div>
            }
          </div>
        </div>
      }
      
      <!-- Orders Tab with Refresh -->
      @if (activeTab === 'orders') {
        <div class="orders-section">
          <div class="section-header">
            <h3>Orders ({{ orders.length }})</h3>
            <button (click)="loadOrders()" class="refresh-btn" [disabled]="loadingOrders">
              {{ loadingOrders ? 'Loading...' : '🔄 Refresh' }}
            </button>
          </div>
          
          @if (loadingOrders) {
            <div class="loading">Loading orders...</div>
          }
          
          @if (!loadingOrders && orders.length === 0) {
            <div class="no-orders">No orders yet.</div>
          }
          
          @for (order of orders; track order._id) {
            <div class="order-card">
              <div class="order-header">
                <span class="order-number">Order #{{ order.orderNumber || 'N/A' }}</span>
                <span class="order-status" [class]="order.orderStatus || 'pending'">
                  {{ order.orderStatus || 'Pending' }}
                </span>
              </div>
              
              @if (order.items && order.items.length > 0) {
                <div class="order-items">
                  @for (item of order.items; track item.product) {
                    <div class="order-item">
                      <span>{{ item.name || 'Unknown Product' }}</span>
                      <span>x{{ item.quantity || 0 }}</span>
                      <span>₱{{ ((item.price || 0) * (item.quantity || 0)).toLocaleString() }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div style="padding: 15px; text-align: center; color: #999; background: #f5f5f5; border-radius: 8px; margin: 10px 0;">
                  ⚠️ No items found in this order
                </div>
              }
              
              <div class="order-footer">
                <span class="order-total">Total: ₱{{ (order.totalAmount || 0).toLocaleString() }}</span>
                <div class="order-actions">
                  <select [(ngModel)]="order.orderStatus" (change)="updateOrderStatus(order._id, order.orderStatus)">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          }
        </div>
      }
      
      <!-- Add Product Tab -->
      @if (activeTab === 'add') {
        <div class="add-product-section">
          <h2>Add New Product</h2>
          
          <form (ngSubmit)="addProduct()" #productForm="ngForm">
            <div class="form-row">
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" [(ngModel)]="newProduct.name" name="name" required class="form-control" placeholder="e.g., Fresh Strawberries">
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select [(ngModel)]="newProduct.category" name="category" required class="form-control">
                  <option value="">Select Category</option>
                  <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                  <option value="Coffee & Tea">Coffee & Tea</option>
                  <option value="Woven Products">Woven Products</option>
                  <option value="Wood Carvings">Wood Carvings</option>
                  <option value="Snacks & Pasalubong">Snacks & Pasalubong</option>
                  <option value="Handicrafts">Handicrafts</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Description *</label>
              <textarea [(ngModel)]="newProduct.description" name="description" required class="form-control" rows="4" placeholder="Describe your product..."></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Price * (₱)</label>
                <input type="number" [(ngModel)]="newProduct.price" name="price" required class="form-control" min="0" step="0.01" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>Stock *</label>
                <input type="number" [(ngModel)]="newProduct.stock" name="stock" required class="form-control" min="0" placeholder="Quantity">
              </div>
            </div>
            
            <div class="form-group">
              <label>Origin</label>
              <input type="text" [(ngModel)]="newProduct.origin" name="origin" class="form-control" placeholder="e.g., La Trinidad, Benguet" value="Benguet">
            </div>
            
            <!-- Image Upload Section -->
            <div class="form-group">
              <label>Product Images</label>
              <div class="image-upload-area" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                <input type="file" #fileInput (change)="onFilesSelected($event)" accept="image/*" multiple style="display: none">
                <button type="button" (click)="fileInput.click()" class="upload-btn">
                  📸 Select Images from Computer
                </button>
                <p class="upload-hint">Click to select or drag & drop images (Max 5 images, up to 5MB each)</p>
                
                @if (imagePreviews.length > 0) {
                  <div class="image-previews">
                    @for (preview of imagePreviews; track preview; let i = $index) {
                      <div class="preview-item">
                        <img [src]="preview" class="preview-img">
                        <button type="button" (click)="removeImage(i)" class="remove-img">✖</button>
                      </div>
                    }
                  </div>
                }
                
                @if (uploading) {
                  <div class="upload-progress">
                    <div class="progress-bar" [style.width]="uploadProgress + '%'"></div>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                }
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="submit-btn" [disabled]="productForm.invalid || uploading">
                ➕ Add Product
              </button>
              <button type="button" (click)="resetForm()" class="reset-btn">Reset</button>
            </div>
          </form>
          
          @if (message) {
            <div class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
              {{ message }}
            </div>
          }
        </div>
      }
      
      <!-- Edit Product Modal -->
      @if (editingProduct) {
        <div class="modal-overlay">
          <div class="modal">
            <h2>Edit Product</h2>
            <div class="form-group">
              <label>Name</label>
              <input [(ngModel)]="editingProduct.name" class="form-control">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="editingProduct.description" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Price</label>
                <input type="number" [(ngModel)]="editingProduct.price" class="form-control">
              </div>
              <div class="form-group">
                <label>Stock</label>
                <input type="number" [(ngModel)]="editingProduct.stock" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="editingProduct.category" class="form-control">
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Coffee & Tea">Coffee & Tea</option>
                <option value="Woven Products">Woven Products</option>
                <option value="Wood Carvings">Wood Carvings</option>
                <option value="Snacks & Pasalubong">Snacks & Pasalubong</option>
                <option value="Handicrafts">Handicrafts</option>
              </select>
            </div>
            <div class="modal-actions">
              <button (click)="saveEdit()" class="save-btn">💾 Save</button>
              <button (click)="cancelEdit()" class="cancel-btn">❌ Cancel</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .dashboard-header { background: linear-gradient(135deg, #ee4d2d, #ff6b4a); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .dashboard-header h1 { margin: 0 0 10px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-icon { font-size: 40px; }
    .stat-info h3 { font-size: 28px; margin: 0; color: #333; }
    .stat-info p { margin: 5px 0 0; color: #666; }
    .stat-card.warning .stat-info h3 { color: #ff9800; }
    
    .badge {
      background: #f44336;
      color: white;
      border-radius: 50%;
      padding: 2px 8px;
      font-size: 12px;
      margin-left: 5px;
    }
    
    .tabs { display: flex; gap: 10px; margin-bottom: 30px; border-bottom: 1px solid #ddd; }
    .tabs button { padding: 12px 24px; background: none; border: none; cursor: pointer; font-size: 16px; transition: all 0.2s; }
    .tabs button.active { color: #ee4d2d; border-bottom: 2px solid #ee4d2d; }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .refresh-btn {
      background: #2e7d32;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }
    
    .refresh-btn:hover:not(:disabled) {
      background: #1b5e20;
      transform: translateY(-2px);
    }
    
    .refresh-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .product-card:hover { transform: translateY(-5px); }
    .product-images { height: 200px; overflow: hidden; }
    .product-images img { width: 100%; height: 100%; object-fit: cover; }
    .product-info { padding: 15px; }
    .product-card h3 { margin: 0 0 10px 0; font-size: 16px; }
    .price { color: #ee4d2d; font-size: 20px; font-weight: bold; margin: 5px 0; }
    .stock { color: #666; font-size: 14px; }
    .category { background: #f0f0f0; display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 10px; }
    .product-actions { padding: 10px 15px 15px; display: flex; gap: 10px; }
    .edit-btn, .delete-btn { flex: 1; padding: 8px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .edit-btn { background: #2196F3; color: white; }
    .delete-btn { background: #f44336; color: white; }
    
    .image-upload-area { border: 2px dashed #ddd; border-radius: 12px; padding: 20px; text-align: center; background: #fafafa; transition: all 0.3s; }
    .image-upload-area.drag-over { border-color: #ee4d2d; background: #fff5f2; }
    .upload-btn { background: #ee4d2d; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-bottom: 10px; transition: all 0.3s; }
    .upload-btn:hover { transform: scale(1.02); }
    .upload-hint { font-size: 12px; color: #999; margin: 5px 0; }
    .image-previews { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; justify-content: center; }
    .preview-item { position: relative; width: 100px; height: 100px; }
    .preview-img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 2px solid #ddd; }
    .remove-img { position: absolute; top: -8px; right: -8px; background: #f44336; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
    .remove-img:hover { transform: scale(1.1); }
    .upload-progress { margin-top: 15px; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden; position: relative; }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; }
    
    .add-product-section { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
    .form-control { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    .form-control:focus { outline: none; border-color: #ee4d2d; }
    textarea.form-control { resize: vertical; }
    .form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .form-actions { display: flex; gap: 15px; margin-top: 20px; }
    .submit-btn { flex: 1; background: #4caf50; color: white; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
    .reset-btn { padding: 14px 30px; background: #999; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .submit-btn:disabled { background: #ccc; cursor: not-allowed; }
    .message { margin-top: 20px; padding: 12px; border-radius: 8px; text-align: center; }
    .message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    
    .order-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
    .order-number { font-weight: bold; }
    .order-status { padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .order-status.pending { background: #fff3e0; color: #ff9800; }
    .order-status.processing { background: #e3f2fd; color: #2196F3; }
    .order-status.shipped { background: #e8f5e9; color: #4caf50; }
    .order-status.delivered { background: #e8f5e9; color: #4caf50; }
    .order-status.cancelled { background: #ffebee; color: #f44336; }
    .order-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .order-footer { margin-top: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .order-total { font-weight: bold; font-size: 16px; }
    .order-actions select { padding: 6px 12px; border-radius: 6px; border: 1px solid #ddd; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; }
    .modal-actions { display: flex; gap: 15px; margin-top: 20px; }
    .save-btn, .cancel-btn { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .save-btn { background: #4caf50; color: white; }
    .cancel-btn { background: #f44336; color: white; }
    .no-products, .no-orders { text-align: center; padding: 60px; background: white; border-radius: 12px; color: #666; }
    
    @media (max-width: 768px) { 
      .form-row { grid-template-columns: 1fr; }
      .order-footer { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class SellerDashboardComponent implements OnInit, OnDestroy {
  ecommerceService = inject(EcommerceService);
  
  activeTab = 'products';
  products: any[] = [];
  orders: any[] = [];
  loadingProducts = false;
  loadingOrders = false;
  stats = { totalProducts: 0, totalOrders: 0, totalSales: 0, lowStock: 0 };
  editingProduct: any = null;
  message = '';
  messageType = '';
  
  // Track previous order count for notifications
  previousOrderCount = 0;
  newOrderCount = 0;
  
  // Image upload properties
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  uploading = false;
  uploadProgress = 0;
  
  newProduct = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    origin: 'Benguet',
    images: [] as string[]
  };
  
  private refreshInterval: any;
  
  ngOnInit() {
    console.log('👤 Current Seller:', this.ecommerceService.currentUser());
    
    this.loadProducts();
    this.loadOrders();
    
    setTimeout(() => {
      this.previousOrderCount = this.orders.length;
      this.newOrderCount = 0;
    }, 1000);
    
    this.refreshInterval = setInterval(() => {
      if (this.activeTab === 'orders') {
        console.log('🔄 Auto-refreshing orders...');
        this.loadOrders();
      }
      if (this.activeTab === 'products') {
        this.loadProducts();
      }
    }, 10000);
  }
  
  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
  
  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'orders') {
      this.previousOrderCount = this.orders.length;
      this.newOrderCount = 0;
      this.loadOrders();
    }
    if (tab === 'products') {
      this.loadProducts();
    }
  }
  
  loadProducts() {
    this.loadingProducts = true;
    this.ecommerceService.getSellerProducts().subscribe({
      next: (res: any) => {
        this.products = res;
        this.stats.totalProducts = res.length;
        this.stats.lowStock = res.filter((p: any) => p.stock < 10).length;
        this.loadingProducts = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loadingProducts = false;
      }
    });
  }
  
  loadOrders() {
    this.loadingOrders = true;
    console.log('🔄 Loading orders...');
    
    this.ecommerceService.getSellerOrders().subscribe({
      next: (res: any) => {
        console.log(`📦 Loaded ${res.length} orders`);
        
        const currentCount = res.length;
        if (currentCount > this.previousOrderCount && this.previousOrderCount > 0) {
          const newCount = currentCount - this.previousOrderCount;
          this.showNewOrderNotification(newCount);
          this.newOrderCount = newCount;
        } else {
          this.newOrderCount = 0;
        }
        this.previousOrderCount = currentCount;
        
        this.orders = res.map((order: any) => ({
          ...order,
          items: order.items || []
        }));
        
        this.stats.totalOrders = this.orders.length;
        this.stats.totalSales = this.orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
        this.loadingOrders = false;
        
        setTimeout(() => {}, 0);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loadingOrders = false;
        this.showMessage('Failed to load orders: ' + (err.error?.error || err.message), 'error');
      }
    });
  }
  
  showNewOrderNotification(count: number) {
    if (count === 1) {
      this.showMessage('🔔 New order received!', 'success');
    } else {
      this.showMessage(`🔔 ${count} new orders received!`, 'success');
    }
    
    document.title = `📦 ${count} New Order${count > 1 ? 's' : ''} - Cordi Cart`;
    
    setTimeout(() => {
      document.title = 'Cordi Cart - Seller Dashboard';
    }, 5000);
  }
  
  onFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.handleFiles(files);
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const uploadArea = target.closest('.image-upload-area');
    if (uploadArea) {
      uploadArea.classList.add('drag-over');
    }
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = event.target as HTMLElement;
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }
  
  handleFiles(files: File[]) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const remainingSlots = 5 - this.selectedFiles.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);
    
    filesToAdd.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage(`File ${file.name} is too large (max 5MB)`, 'error');
        return;
      }
      
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
    
    if (filesToAdd.length < imageFiles.length) {
      this.showMessage(`Maximum 5 images allowed`, 'error');
    }
  }
  
  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }
  
  // ✅ UPDATED: Upload images as binary data
  async uploadImages(): Promise<any[]> {
    if (this.selectedFiles.length === 0) return [];
    
    this.uploading = true;
    this.uploadProgress = 0;
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      this.uploadProgress = 100;
      setTimeout(() => { this.uploading = false; }, 500);
      
      // Return the image data (binary) for storage in MongoDB
      return data.images || [];
    } catch (error) {
      console.error('Upload error:', error);
      this.uploading = false;
      this.showMessage('Failed to upload images', 'error');
      return [];
    }
  }
  
  // ✅ UPDATED: Add product with binary image data
  async addProduct() {
    if (!this.newProduct.name || !this.newProduct.description || !this.newProduct.category) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }
    
    if (this.newProduct.price <= 0) {
      this.showMessage('Price must be greater than 0', 'error');
      return;
    }
    
    if (this.newProduct.stock < 0) {
      this.showMessage('Stock cannot be negative', 'error');
      return;
    }
    
    let imageData: any[] = [];
    if (this.selectedFiles.length > 0) {
      imageData = await this.uploadImages();
      if (imageData.length === 0 && this.selectedFiles.length > 0) {
        this.showMessage('Failed to upload images. Please try again.', 'error');
        return;
      }
    }
    
    const productData = {
      name: this.newProduct.name,
      description: this.newProduct.description,
      price: this.newProduct.price,
      stock: this.newProduct.stock,
      category: this.newProduct.category,
      origin: this.newProduct.origin || 'Benguet',
      images: imageData,  // ✅ This will store binary data in MongoDB
      isActive: true
    };
    
    this.ecommerceService.addProduct(productData).subscribe({
      next: (response: any) => {
        this.showMessage('✅ Product added successfully!', 'success');
        this.resetForm();
        this.loadProducts();
        this.activeTab = 'products';
        
        setTimeout(() => {
          this.message = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error adding product:', err);
        this.showMessage('❌ Failed to add product. ' + (err.error?.error || 'Please try again.'), 'error');
      }
    });
  }
  
  showMessage(msg: string, type: string) {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
  
  resetForm() {
    this.newProduct = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
      origin: 'Benguet',
      images: []
    };
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.uploading = false;
    this.uploadProgress = 0;
  }
  
  editProduct(product: any) {
    this.editingProduct = { ...product };
  }
  
  saveEdit() {
    this.ecommerceService.updateProduct(this.editingProduct._id, this.editingProduct).subscribe({
      next: () => {
        this.showMessage('✅ Product updated successfully!', 'success');
        this.editingProduct = null;
        this.loadProducts();
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.showMessage('❌ Update failed: ' + (err.error?.error || err.message), 'error');
      }
    });
  }
  
  cancelEdit() {
    this.editingProduct = null;
  }
  
  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      console.log(`🗑️ Deleting product ${id}...`);
      
      this.ecommerceService.deleteProduct(id).subscribe({
        next: (response) => {
          console.log('✅ Product deleted:', response);
          this.showMessage('✅ Product deleted successfully!', 'success');
          this.loadProducts();
        },
        error: (err) => {
          console.error('❌ Delete failed:', err);
          console.error('❌ Error details:', err.error);
          this.showMessage('❌ Failed to delete product: ' + (err.error?.error || err.message || 'Please try again.'), 'error');
          this.loadProducts();
        }
      });
    }
  }
  
  updateOrderStatus(orderId: string, status: string) {
    console.log(`📦 Updating order ${orderId} to status: ${status}`);
    
    this.ecommerceService.updateOrderStatus(orderId, status).subscribe({
      next: (response: any) => {
        console.log('✅ Order status updated:', response);
        this.showMessage('✅ Order status updated successfully!', 'success');
        setTimeout(() => {
          this.loadOrders();
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Update failed:', err);
        this.showMessage('❌ Failed to update order status: ' + (err.error?.error || err.message), 'error');
        this.loadOrders();
      }
    });
  }
}