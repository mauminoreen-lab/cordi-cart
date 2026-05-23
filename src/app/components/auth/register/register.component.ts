import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EcommerceService } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h2>Create Account</h2>
        <p class="subtitle">Join CordiCart today!</p>
        
        <form (ngSubmit)="register()" #registerForm="ngForm">
          <div class="form-group">
            <label>Username</label>
            <input type="text" [(ngModel)]="username" name="username" required class="form-control" placeholder="Enter username">
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required class="form-control" placeholder="Enter email">
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required class="form-control" placeholder="Enter password">
          </div>
          
          <div class="form-group">
            <label>Confirm Password</label>
            <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required class="form-control" placeholder="Confirm password">
          </div>
          
          <div class="form-group">
            <label>Register as</label>
            <div class="role-selector">
              <label class="role-option">
                <input type="radio" [(ngModel)]="role" name="role" value="buyer">
                <span class="role-icon">🛍️</span>
                <strong>Buyer</strong>
                <small>Shop and purchase products</small>
              </label>
              <label class="role-option">
                <input type="radio" [(ngModel)]="role" name="role" value="seller">
                <span class="role-icon">🏪</span>
                <strong>Seller</strong>
                <small>Sell your products</small>
              </label>
            </div>
          </div>
          
          @if (error) {
            <div class="error">{{ error }}</div>
          }
          
          <button type="submit" class="register-btn" [disabled]="registerForm.invalid || password !== confirmPassword">
            Register
          </button>
        </form>
        
        <p class="login-link">
          Already have an account? <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; background: #f5f5f5; padding: 20px; }
    .register-card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; width: 100%; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #333; margin-bottom: 10px; }
    .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
    .form-control { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    .form-control:focus { outline: none; border-color: #ee4d2d; }
    .role-selector { display: flex; gap: 15px; }
    .role-option { flex: 1; padding: 15px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; }
    .role-option:hover { border-color: #ee4d2d; background: #fff5f2; }
    input[type="radio"] { margin-right: 10px; }
    .role-icon { font-size: 24px; display: block; margin-bottom: 5px; }
    .role-option small { display: block; font-size: 11px; color: #666; margin-top: 5px; }
    .error { background: #ffebee; color: #c62828; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; }
    .register-btn { width: 100%; padding: 14px; background: #ee4d2d; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    .register-btn:hover { background: #d93c1a; }
    .register-btn:disabled { background: #ccc; cursor: not-allowed; }
    .login-link { text-align: center; margin-top: 20px; color: #666; }
    .login-link a { color: #ee4d2d; text-decoration: none; }
  `]
})
export class RegisterComponent {
  private ecommerceService = inject(EcommerceService);
  private router = inject(Router);
  
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'buyer';
  error = '';
  
  register() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    
    this.ecommerceService.register(this.username, this.email, this.password, this.role).subscribe({
      next: (res: any) => {
        this.ecommerceService.setAuthData(res.token, res.user);
        if (this.role === 'seller') {
          this.router.navigate(['/seller/dashboard']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed';
      }
    });
  }
}