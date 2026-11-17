import { Component, inject, signal, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SearchService } from '../services/search.service';
import { ProgressService } from '../services/progress.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  readonly searchService = inject(SearchService);
  readonly progressService = inject(ProgressService);

  isOpen = input<boolean>(false);
  closeSidenav = output<void>();

  // Map of open module sections; default Module 1 & 2 open
  readonly expandedModules = signal<Record<string, boolean>>({
    module1: true,
    module2: true,
    module3: true,
    module4: true,
    module5: true,
    module6: true,
    module7: true,
    module8: true
  });

  toggleModule(moduleId: string): void {
    const current = { ...this.expandedModules() };
    current[moduleId] = !current[moduleId];
    this.expandedModules.set(current);
  }

  isModuleExpanded(moduleId: string): boolean {
    return !!this.expandedModules()[moduleId];
  }

  onLinkClick(): void {
    // If on mobile screen, close drawer on navigation
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.closeSidenav.emit();
    }
  }
}
