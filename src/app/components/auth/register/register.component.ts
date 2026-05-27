import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EcommerceService } from '../../../services/ecommerce.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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
        if (res.user.role === 'seller') {
          this.router.navigate(['/seller']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.error = err.error?.error || 'Registration failed';
      }
    });
  }
}