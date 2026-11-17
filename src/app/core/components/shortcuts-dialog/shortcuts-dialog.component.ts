import { Component, inject } from '@angular/core';
import { KeyboardNavigationService } from '../../services/keyboard-navigation.service';

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  templateUrl: './shortcuts-dialog.component.html',
  styleUrl: './shortcuts-dialog.component.scss'
})
export class ShortcutsDialogComponent {
  readonly navService = inject(KeyboardNavigationService);

  close(): void {
    this.navService.isHelpOpen.set(false);
  }
}
