import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './topbar.component';
import { SidenavComponent } from './sidenav.component';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { SearchPaletteComponent } from '../components/search-palette/search-palette.component';
import { ShortcutsDialogComponent } from '../components/shortcuts-dialog/shortcuts-dialog.component';
import { KeyboardNavigationService } from '../services/keyboard-navigation.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    TopbarComponent,
    SidenavComponent,
    BreadcrumbsComponent,
    SearchPaletteComponent,
    ShortcutsDialogComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  // Inject KeyboardNavigationService at shell root to register global shortcut listeners
  private readonly keyboardNavService = inject(KeyboardNavigationService);

  readonly isSidenavOpen = signal<boolean>(false);

  toggleSidenav(): void {
    this.isSidenavOpen.update(v => !v);
  }

  closeSidenav(): void {
    this.isSidenavOpen.set(false);
  }
}
