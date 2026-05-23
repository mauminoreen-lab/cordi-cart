import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EcommerceService } from '../services/ecommerce.service';

export const adminGuard = () => {
  const ecommerceService = inject(EcommerceService);
  const router = inject(Router);
  
  if (ecommerceService.isLoggedIn() && ecommerceService.isAdmin()) {
    return true;
  }
  
  router.navigate(['/']);
  return false;
};