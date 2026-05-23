import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EcommerceService } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-delivery-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <h2>Delivery Tracking</h2>
      
      @if (order) {
        <div class="tracking-info">
          <p><strong>Order #:</strong> {{ order.orderNumber }}</p>
          <p><strong>Status:</strong> {{ order.orderStatus }}</p>
          <p><strong>Payment:</strong> {{ order.paymentMethod }}</p>
          <p><strong>Total:</strong> ₱{{ order.totalAmount }}</p>
        </div>
        <a routerLink="/orders" class="back-btn">← Back to Orders</a>
      } @else {
        <p>Loading...</p>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h2 { margin-bottom: 20px; color: #333; }
    .tracking-info { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .tracking-info p { margin: 10px 0; }
    .back-btn { display: inline-block; padding: 10px 20px; background: #ee4d2d; color: white; text-decoration: none; border-radius: 8px; }
  `]
})
export class DeliveryTrackingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ecommerceService = inject(EcommerceService);
  
  order: any = null;
  
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ecommerceService.getOrder(id).subscribe({
        next: (order: any) => {
          this.order = order;
          console.log('Order loaded:', order);
        },
        error: (err: any) => console.error('Error loading order:', err)
      });
    }
  }
}