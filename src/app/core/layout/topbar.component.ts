import { Component, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../services/progress.service';
import { SearchService } from '../services/search.service';
import { KeyboardNavigationService } from '../services/keyboard-navigation.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  readonly progressService = inject(ProgressService);
  readonly searchService = inject(SearchService);
  readonly keyboardNavService = inject(KeyboardNavigationService);

  toggleSidenav = output<void>();

  readonly isProgressDetailsOpen = signal<boolean>(false);

  openSearch(): void {
    this.searchService.openSearch();
  }

  toggleProgressDetails(): void {
    this.isProgressDetailsOpen.update(v => !v);
  }

  closeProgressDetails(): void {
    this.isProgressDetailsOpen.set(false);
  }

  openShortcutsHelp(): void {
    this.keyboardNavService.toggleHelp();
  }
}
