import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EcommerceService } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Welcome Back!</h2>
        <p class="subtitle">Login to your CordiCart account</p>
        
        <form (ngSubmit)="login()" #loginForm="ngForm">
          <div class="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              required 
              class="form-control" 
              placeholder="Enter your email">
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              required 
              class="form-control" 
              placeholder="Enter your password">
          </div>
          
          @if (error) {
            <div class="error">{{ error }}</div>
          }
          
          <button type="submit" class="login-btn" [disabled]="loginForm.invalid">
            Login
          </button>
        </form>
        
        <p class="register-link">
          Don't have an account? <a routerLink="/register">Register now</a>
        </p>
        
        <div class="demo-accounts">
          <p>Demo Accounts:</p>
          <div class="demo-buttons">
            <button (click)="demoLogin('admin@ecommerce.com', 'admin123')" class="demo-btn admin">Admin Login</button>
            <button (click)="demoLogin('seller@test.com', 'seller123')" class="demo-btn seller">Seller Login</button>
            <button (click)="demoLogin('buyer@test.com', 'buyer123')" class="demo-btn buyer">Buyer Login</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container { 
      min-height: calc(100vh - 70px); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px; 
    }
    .login-card { 
      background: white; 
      border-radius: 20px; 
      padding: 40px; 
      max-width: 450px; 
      width: 100%; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    }
    h2 { text-align: center; color: #333; margin-bottom: 10px; font-size: 28px; }
    .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
    .form-control { 
      width: 100%; 
      padding: 12px 15px; 
      border: 2px solid #e0e0e0; 
      border-radius: 10px; 
      font-size: 14px;
      transition: all 0.3s;
    }
    .form-control:focus { 
      outline: none; 
      border-color: #ee4d2d; 
      box-shadow: 0 0 0 3px rgba(238,77,45,0.1);
    }
    .error { 
      background: #ffebee; 
      color: #c62828; 
      padding: 12px; 
      border-radius: 8px; 
      margin-bottom: 20px; 
      font-size: 14px; 
      text-align: center;
    }
    .login-btn { 
      width: 100%; 
      padding: 14px; 
      background: linear-gradient(135deg, #ee4d2d, #ff6b4a);
      color: white; 
      border: none; 
      border-radius: 10px; 
      font-size: 16px; 
      font-weight: bold; 
      cursor: pointer; 
      transition: all 0.3s; 
    }
    .login-btn:hover { 
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(238,77,45,0.4);
    }
    .login-btn:disabled { 
      background: #ccc; 
      cursor: not-allowed; 
      transform: none;
    }
    .register-link { 
      text-align: center; 
      margin-top: 20px; 
      color: #666; 
    }
    .register-link a { 
      color: #ee4d2d; 
      text-decoration: none; 
      font-weight: bold;
    }
    .register-link a:hover { text-decoration: underline; }
    .demo-accounts { 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #eee; 
      text-align: center;
    }
    .demo-accounts p { 
      font-size: 12px; 
      color: #999; 
      margin-bottom: 10px; 
    }
    .demo-buttons { 
      display: flex; 
      gap: 10px; 
      justify-content: center; 
      flex-wrap: wrap;
    }
    .demo-btn { 
      padding: 6px 12px; 
      border: none; 
      border-radius: 20px; 
      font-size: 11px; 
      cursor: pointer; 
      transition: all 0.2s;
    }
    .demo-btn.admin { background: #f44336; color: white; }
    .demo-btn.seller { background: #ff9800; color: white; }
    .demo-btn.buyer { background: #4caf50; color: white; }
    .demo-btn:hover { transform: scale(1.05); opacity: 0.9; }
  `]
})
export class LoginComponent {
  private ecommerceService = inject(EcommerceService);
  private router = inject(Router);
  
  email = '';
  password = '';
  error = '';
  
  login() {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }
    
    this.ecommerceService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log('Login response:', response);
        
        // Save auth data
        this.ecommerceService.setAuthData(response.token, response.user);
        
        // Redirect based on role
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (response.user.role === 'seller') {
          this.router.navigate(['/seller']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error = err.error?.error || 'Invalid email or password';
      }
    });
  }
  
  demoLogin(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.login();
  }
}