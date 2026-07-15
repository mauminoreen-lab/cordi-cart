import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EcommerceService, Product } from '../../../services/ecommerce.service'; // ✅ Import Product from service

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Products</h2>
      
      @if (searchQuery) {
        <div class="search-info">
          Showing results for: "<strong>{{ searchQuery }}</strong>"
          <span>({{ products.length }} products found)</span>
          <button (click)="clearSearch()" class="clear-search-btn">✖ Clear</button>
        </div>
      }
      
      @if (loading) {
        <div class="loading">Loading products...</div>
      }
      
      @if (error) {
        <div class="error">
          <p>{{ error }}</p>
          <button (click)="loadProducts()">Try Again</button>
        </div>
      }
      
      <div class="products-grid">
        @for (product of products; track product._id) {
          <div class="product-card">
            <div class="product-image">
              <img [src]="(product.images && product.images.length > 0) ? product.images[0] : 'https://via.placeholder.com/200'" [alt]="product.name">
            </div>
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="seller">by {{ product.sellerName }}</p>
              <p class="price">₱{{ product.price.toLocaleString() }}</p>
              <p class="stock">Stock: {{ product.stock || 0 }}</p>
            </div>
            
            @if (!isSeller && !isAdmin && product.stock > 0) {
              <button (click)="addToCart(product._id)" class="add-btn">
                🛒 Add to Cart
              </button>
            }
            
            @if (isSeller && product.seller === currentUserId) {
              <div class="seller-badge">Your Product</div>
            }
            
            @if (product.stock === 0) {
              <div class="out-of-stock">Out of Stock</div>
            }
          </div>
        }
      </div>
      
      @if (!loading && !error && products.length === 0) {
        <div class="no-products">
          @if (searchQuery) {
            <p>No products found for "<strong>{{ searchQuery }}</strong>"</p>
            <button (click)="clearSearch()" class="clear-search-btn">Clear Search</button>
          } @else {
            <p>No products available.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [` .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h2 { color: #333; margin-bottom: 20px; }
    
    .search-info {
      padding: 12px 16px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 20px;
      color: #2e7d32;
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .search-info span {
      font-size: 14px;
      color: #666;
    }
    
    .clear-search-btn {
      padding: 4px 12px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .clear-search-btn:hover {
      background: #d32f2f;
    }
    
    .loading, .error, .no-products { 
      text-align: center; 
      padding: 40px; 
      background: white; 
      border-radius: 12px; 
      margin: 20px; 
    }
    
    .error { color: red; }
    
    .products-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 20px; 
    }
    
    .product-card { 
      background: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
      transition: transform 0.2s; 
      position: relative; 
    }
    
    .product-card:hover { transform: translateY(-5px); }
    
    .product-image { height: 200px; overflow: hidden; }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    
    .product-info { padding: 15px; }
    .product-card h3 { margin-bottom: 5px; font-size: 16px; }
    .seller { font-size: 12px; color: #999; margin-bottom: 5px; }
    .price { color: #ee4d2d; font-size: 20px; font-weight: bold; margin-bottom: 5px; }
    .stock { color: #666; font-size: 12px; }
    
    .add-btn { 
      width: calc(100% - 30px); 
      margin: 0 15px 15px; 
      padding: 10px; 
      background: #ee4d2d; 
      color: white; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: bold; 
    }
    
    .add-btn:hover { background: #d93c1a; }
    
    .seller-badge { 
      position: absolute; 
      top: 10px; 
      right: 10px; 
      background: #ff9800; 
      color: white; 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-size: 11px; 
      font-weight: bold; 
    }
    
    .out-of-stock { 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      background: rgba(0,0,0,0.7); 
      color: white; 
      padding: 5px 10px; 
      border-radius: 4px; 
      font-size: 12px; 
    }`]
})
export class ProductListComponent implements OnInit {
  private ecommerceService = inject(EcommerceService);
  private route = inject(ActivatedRoute);
  
  products: Product[] = [];
  loading = true;
  error = '';
  searchQuery = '';
  
  get isSeller() {
    return this.ecommerceService.isSeller();
  }
  
  get isAdmin() {
    return this.ecommerceService.isAdmin();
  }
  
  get currentUserId() {
    return this.ecommerceService.currentUser()?._id;
  }
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.loadProducts();
    });
  }
  
  loadProducts() {
    this.loading = true;
    this.error = '';
    
    this.ecommerceService.getProducts(undefined, this.searchQuery).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = `Cannot connect to backend: ${err.message}`;
        this.loading = false;
      }
    });
  }
  
  clearSearch() {
    this.searchQuery = '';
    window.location.href = '/products';
  }
  
  addToCart(productId: string) {
    if (this.isSeller) {
      alert('Sellers cannot purchase products. Please register as a buyer to shop.');
      return;
    }
    
    if (!this.ecommerceService.isLoggedIn()) {
      alert('Please login to add items to cart');
      return;
    }
    
    this.ecommerceService.addToCart(productId, 1).subscribe({
      next: (cart) => {
        this.ecommerceService.cart.set(cart);
        const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        this.ecommerceService.cartCount.set(count);
        alert('Product added to cart!');
      },
      error: (err) => console.error('Error adding to cart:', err)
    });
  }
}