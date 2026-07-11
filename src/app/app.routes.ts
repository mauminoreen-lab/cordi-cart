import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { sellerGuard } from './guards/seller.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { 
    path: 'products', 
    loadComponent: () => import('./components/buyer/product-list/product-list.component').then(m => m.ProductListComponent) 
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./components/buyer/cart/cart.component').then(m => m.CartComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./components/buyer/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard] 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'seller', 
    canActivate: [sellerGuard],
    loadComponent: () => import('./components/seller/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent)
  },
  { path: '**', redirectTo: '/products' }
];