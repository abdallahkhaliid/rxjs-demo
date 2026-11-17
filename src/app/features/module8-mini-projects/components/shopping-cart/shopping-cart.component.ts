import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConsoleEntry, PlaygroundTab } from '../../../../core/models';
import { CATALOG_PRODUCTS, MODULE8_PROJECTS } from '../../module8.data';
import { CartItem, CartSummary, CatalogProduct, MiniProjectTopicConfig } from '../../module8.models';
import { CartService } from '../../services/cart.service';

import { PlaygroundWrapperComponent } from '../../../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../../../shared/components/quiz-block/quiz-block.component';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.scss'
})
export class ShoppingCartComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly config: MiniProjectTopicConfig = MODULE8_PROJECTS['shopping-cart'];
  readonly catalog: CatalogProduct[] = CATALOG_PRODUCTS;
  readonly activeTab = signal<PlaygroundTab>('visual');

  readonly couponControl = new FormControl<string>('');
  readonly cartItems = signal<CartItem[]>([]);
  readonly cartSummary = signal<CartSummary>({
    subtotal: 0,
    discountRate: 0,
    discount: 0,
    tax: 0,
    total: 0,
    appliedCoupon: null,
    itemCount: 0
  });

  readonly isCheckingOut = signal<boolean>(false);
  readonly orderReceipt = signal<string | null>(null);

  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private entryIdCounter = 0;
  private readonly startTime = Date.now();

  ngOnInit(): void {
    this.cartService.cartItems$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.cartItems.set(items);
        this.logEntry('next', `Cart items updated: ${items.length} unique products`);
      });

    this.cartService.cartSummary$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(summary => {
        this.cartSummary.set(summary);
      });
  }

  addToCart(product: CatalogProduct): void {
    this.cartService.addItem(product, 1);
    this.orderReceipt.set(null);
    this.logEntry('info', `Dispatched ADD action: "${product.name}" ($${product.price})`);
  }

  removeFromCart(id: number): void {
    this.cartService.removeItem(id);
    this.logEntry('info', `Dispatched REMOVE action for item #${id}`);
  }

  incrementQty(item: CartItem): void {
    this.cartService.updateQuantity(item.id, item.qty + 1);
    this.logEntry('info', `Dispatched UPDATE_QTY for "${item.name}" -> ${item.qty + 1}`);
  }

  decrementQty(item: CartItem): void {
    if (item.qty > 1) {
      this.cartService.updateQuantity(item.id, item.qty - 1);
      this.logEntry('info', `Dispatched UPDATE_QTY for "${item.name}" -> ${item.qty - 1}`);
    } else {
      this.removeFromCart(item.id);
    }
  }

  setQty(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    this.cartService.updateQuantity(item.id, isNaN(val) ? 1 : val);
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.orderReceipt.set(null);
    this.logEntry('info', 'Dispatched CLEAR action');
  }

  applyCoupon(): void {
    const code = this.couponControl.value || '';
    this.cartService.applyCoupon(code);
    this.logEntry('info', `Applied coupon code: "${code}"`);
  }

  selectQuickCoupon(code: string): void {
    this.couponControl.setValue(code);
    this.applyCoupon();
  }

  checkout(): void {
    if (this.cartItems().length === 0) return;
    this.isCheckingOut.set(true);
    setTimeout(() => {
      this.isCheckingOut.set(false);
      const receiptNo = `ORD-${Date.now().toString().slice(-6)}`;
      this.orderReceipt.set(
        `Order ${receiptNo} placed successfully! Total charged: $${this.cartSummary().total.toFixed(2)}`
      );
      this.logEntry('complete', `Order completed: ${receiptNo}, Total: $${this.cartSummary().total}`);
      this.cartService.clearCart();
      this.couponControl.setValue('');
    }, 700);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private logEntry(type: 'next' | 'error' | 'complete' | 'info', description: string, value?: any): void {
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.startTime,
      type,
      streamName: 'cart-stream',
      description,
      value
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 19)]);
  }
}
