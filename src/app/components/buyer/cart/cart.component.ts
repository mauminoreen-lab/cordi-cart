import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EcommerceService, CartItem } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      @if (isSeller) {
        <div class="seller-warning">
          <h2>⚠️ Sellers Cannot Access Cart</h2>
          <p>Sellers are only allowed to sell products, not purchase them.</p>
          <p>Please register as a buyer to shop.</p>
          <button (click)="goToProducts()" class="shop-btn">Browse Products</button>
        </div>
      } @else {
        <h2>Shopping Cart</h2>
        
        @if (!cart() || cart()!.items.length === 0) {
          <div class="empty-cart">
            <p>Your cart is empty</p>
            <a routerLink="/products" class="shop-now">Continue Shopping</a>
          </div>
        } @else {
          <div class="cart-content">
            <div class="cart-items">
              @for (item of cart()!.items; track item.product._id) {
                <div class="cart-item">
                  <img [src]="item.product.images[0] || 'https://via.placeholder.com/80'" [alt]="item.product.name">
                  <div class="item-details">
                    <h4>{{ item.product.name }}</h4>
                    <p class="seller">by {{ item.product.sellerName }}</p>
                    <p class="price">₱{{ item.product.price.toLocaleString() }}</p>
                  </div>
                  <div class="item-quantity">
                    <button (click)="updateQuantity(item.product._id, item.quantity - 1)">-</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="updateQuantity(item.product._id, item.quantity + 1)">+</button>
                  </div>
                  <div class="item-total">
                    ₱{{ (item.product.price * item.quantity).toLocaleString() }}
                  </div>
                  <button (click)="removeItem(item.product._id)" class="remove-btn">Remove</button>
                </div>
              }
            </div>
            
            <div class="cart-summary">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₱{{ subtotal.toLocaleString() }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div class="summary-row total">
                <span>Total:</span>
                <span>₱{{ subtotal.toLocaleString() }}</span>
              </div>
              <button (click)="checkout()" class="checkout-btn">Proceed to Checkout</button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h2 { margin-bottom: 20px; color: #333; }
    .empty-cart { text-align: center; padding: 60px; background: white; border-radius: 12px; }
    .shop-now { display: inline-block; margin-top: 15px; padding: 10px 24px; background: #ee4d2d; color: white; text-decoration: none; border-radius: 8px; }
    .cart-content { display: grid; grid-template-columns: 1fr 320px; gap: 30px; }
    @media (max-width: 768px) { .cart-content { grid-template-columns: 1fr; } }
    .cart-items { background: white; border-radius: 12px; overflow: hidden; }
    .cart-item { display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #eee; gap: 20px; flex-wrap: wrap; }
    .cart-item img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
    .item-details { flex: 2; }
    .item-details h4 { margin-bottom: 5px; }
    .seller { font-size: 12px; color: #999; }
    .price { color: #ee4d2d; font-weight: bold; }
    .item-quantity { display: flex; align-items: center; gap: 10px; }
    .item-quantity button { width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer; }
    .item-total { min-width: 100px; font-weight: bold; color: #ee4d2d; }
    .remove-btn { background: none; border: none; color: #ff4444; cursor: pointer; padding: 5px 10px; }
    .cart-summary { background: white; border-radius: 12px; padding: 20px; height: fit-content; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .summary-row.total { font-size: 18px; font-weight: bold; border-bottom: none; margin-top: 10px; }
    .checkout-btn { width: 100%; padding: 15px; background: #ee4d2d; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px; font-size: 16px; font-weight: bold; }
    .seller-warning { text-align: center; padding: 60px; background: white; border-radius: 12px; }
    .seller-warning h2 { color: #ff9800; }
    .seller-warning p { color: #666; margin: 10px 0; }
    .shop-btn { background: #ee4d2d; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px; font-size: 16px; }
  `]
})
export class CartComponent implements OnInit {
  private ecommerceService = inject(EcommerceService);
  private router = inject(Router);
  
  cart = this.ecommerceService.cart;
  subtotal = 0;
  
  get isSeller() {
    return this.ecommerceService.isSeller();
  }
  
  ngOnInit() {
    if (!this.isSeller) {
      this.calculateSubtotal();
    }
  }
  
  calculateSubtotal() {
    const currentCart = this.cart();
    if (currentCart) {
      this.subtotal = currentCart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }
  }
  
  updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeItem(productId);
    } else {
      this.ecommerceService.updateCartItem(productId, newQuantity).subscribe({
        next: () => {
          this.ecommerceService.getCart();
          setTimeout(() => this.calculateSubtotal(), 100);
        },
        error: (err) => console.error(err)
      });
    }
  }
  
  removeItem(productId: string) {
    this.ecommerceService.removeFromCart(productId).subscribe({
      next: () => {
        this.ecommerceService.getCart();
        setTimeout(() => this.calculateSubtotal(), 100);
      },
      error: (err) => console.error(err)
    });
  }
  
  checkout() {
    this.router.navigate(['/checkout']);
  }
  
  goToProducts() {
    this.router.navigate(['/products']);
  }
}