import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EcommerceService } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
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