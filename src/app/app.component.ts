import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main>
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    main {
      min-height: calc(100vh - 140px);
      background: #f5f5f5;
    }
  `]
})
export class AppComponent {}