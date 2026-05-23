import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EcommerceService } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      @if (isSeller) {
        <div class="seller-warning">
          <h2>⚠️ Sellers Cannot Checkout</h2>
          <p>Sellers are only allowed to sell products, not purchase them.</p>
          <p>Please register as a buyer to make purchases.</p>
          <button (click)="goToProducts()" class="shop-btn">Browse Products</button>
        </div>
      } @else {
        <h2>Checkout</h2>
        
        <form (ngSubmit)="placeOrder()" #checkoutForm="ngForm">
          <div class="checkout-container">
            <div class="shipping-section">
              <h3>Shipping Information</h3>
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" [(ngModel)]="shippingAddress.fullName" name="fullName" required class="form-control">
              </div>
              <div class="form-group">
                <label>Street Address *</label>
                <input type="text" [(ngModel)]="shippingAddress.street" name="street" required class="form-control">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>City *</label>
                  <input type="text" [(ngModel)]="shippingAddress.city" name="city" required class="form-control">
                </div>
                <div class="form-group">
                  <label>Province *</label>
                  <input type="text" [(ngModel)]="shippingAddress.province" name="province" required class="form-control">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>ZIP Code *</label>
                  <input type="text" [(ngModel)]="shippingAddress.zipCode" name="zipCode" required class="form-control">
                </div>
                <div class="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" [(ngModel)]="shippingAddress.phone" name="phone" required class="form-control">
                </div>
              </div>
              
              <h3>Payment Method</h3>
              <div class="payment-options">
                <label class="payment-option">
                  <input type="radio" [(ngModel)]="paymentMethod" value="cod" name="paymentMethod" required>
                  <span>💵 Cash on Delivery (COD)</span>
                </label>
                <label class="payment-option">
                  <input type="radio" [(ngModel)]="paymentMethod" value="online" name="paymentMethod" required>
                  <span>💳 Online Payment (Credit Card/Debit Card)</span>
                </label>
              </div>
            </div>
            
            <div class="order-summary">
              <h3>Order Summary</h3>
              <div class="order-items">
                @for (item of cartItems; track item.product._id) {
                  <div class="order-item">
                    <span>{{ item.product.name }} x{{ item.quantity }}</span>
                    <span>₱{{ (item.product.price * item.quantity).toLocaleString() }}</span>
                  </div>
                }
              </div>
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
              <button type="submit" class="place-order-btn" [disabled]="checkoutForm.invalid || !paymentMethod">
                Place Order
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h2 { margin-bottom: 20px; color: #333; }
    .checkout-container { display: grid; grid-template-columns: 1fr 350px; gap: 30px; }
    @media (max-width: 768px) { .checkout-container { grid-template-columns: 1fr; } }
    .shipping-section, .order-summary { background: white; border-radius: 12px; padding: 25px; }
    h3 { margin-bottom: 20px; color: #333; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
    .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .payment-options { display: flex; flex-direction: column; gap: 10px; }
    .payment-option { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; }
    .order-items { border-bottom: 1px solid #eee; margin-bottom: 15px; }
    .order-item { display: flex; justify-content: space-between; padding: 8px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .summary-row.total { font-size: 18px; font-weight: bold; border-bottom: none; margin-top: 10px; }
    .place-order-btn { width: 100%; padding: 14px; background: #ee4d2d; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; }
    .place-order-btn:disabled { background: #ccc; cursor: not-allowed; }
    .seller-warning { text-align: center; padding: 60px; background: white; border-radius: 12px; }
    .seller-warning h2 { color: #ff9800; }
    .seller-warning p { color: #666; margin: 10px 0; }
    .shop-btn { background: #ee4d2d; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px; font-size: 16px; }
  `]
})
export class CheckoutComponent implements OnInit {
  private ecommerceService = inject(EcommerceService);
  private router = inject(Router);
  
  cartItems: any[] = [];
  subtotal = 0;
  paymentMethod = '';
  
  shippingAddress = {
    fullName: '',
    street: '',
    city: '',
    province: '',
    zipCode: '',
    phone: ''
  };
  
  get isSeller() {
    return this.ecommerceService.isSeller();
  }
  
  ngOnInit() {
    if (!this.isSeller) {
      this.loadCart();
    }
  }
  
  loadCart() {
    const cart = this.ecommerceService.cart();
    if (cart) {
      this.cartItems = cart.items;
      this.subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }
  }
  
  placeOrder() {
    this.ecommerceService.createOrder(this.shippingAddress, this.paymentMethod).subscribe({
      next: (order) => {
        alert('Order placed successfully!');
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        console.error('Error placing order:', err);
        alert('Failed to place order. Please try again.');
      }
    });
  }
  
  goToProducts() {
    this.router.navigate(['/products']);
  }
}