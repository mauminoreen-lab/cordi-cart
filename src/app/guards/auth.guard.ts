import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EcommerceService } from '../services/ecommerce.service';

export const authGuard = () => {
  const ecommerceService = inject(EcommerceService);
  const router = inject(Router);
  
  if (ecommerceService.isLoggedIn()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};