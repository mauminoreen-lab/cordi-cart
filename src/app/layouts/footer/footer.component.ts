import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer style="background: #333; color: white; text-align: center; padding: 20px; margin-top: 40px;">
      <p>&copy; 2026 CordiCart. All rights reserved.</p>
    </footer>
  `
})
export class FooterComponent {}