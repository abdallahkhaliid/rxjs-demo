import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, scan, shareReplay, startWith } from 'rxjs/operators';
import { CartAction, CartItem, CartSummary, CatalogProduct } from '../module8.models';
import { VALID_COUPONS } from '../module8.data';

export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  if (!action) return items;
  switch (action.type) {
    case 'ADD': {
      const addQty = Math.max(1, action.qty ?? 1);
      const existing = items.find(i => i.id === action.item.id);
      if (existing) {
        return items.map(i =>
          i.id === action.item.id ? { ...i, qty: i.qty + addQty } : i
        );
      }
      return [...items, { ...action.item, qty: addQty }];
    }
    case 'REMOVE':
      return items.filter(i => i.id !== action.id);
    case 'UPDATE_QTY':
      return items.map(i =>
        i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i
      );
    case 'CLEAR':
      return [];
    default:
      return items;
  }
}

export function computeCartSummary(items: CartItem[], couponCode: string): CartSummary {
  const subtotalRaw = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const subtotal = Math.round(subtotalRaw * 100) / 100;
  
  const normalizedCoupon = (couponCode || '').trim().toUpperCase();
  const discountRate = VALID_COUPONS[normalizedCoupon] ?? 0;
  const discount = Math.round(subtotal * discountRate * 100) / 100;
  const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
  const total = Math.round((subtotal - discount + tax) * 100) / 100;
  const itemCount = items.reduce((cnt, item) => cnt + item.qty, 0);

  return {
    subtotal,
    discountRate,
    discount,
    tax,
    total,
    appliedCoupon: discountRate > 0 ? normalizedCoupon : null,
    itemCount
  };
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly action$ = new Subject<CartAction>();
  private readonly coupon$ = new BehaviorSubject<string>('');

  private currentItems: CartItem[] = [];
  private currentSummary: CartSummary = computeCartSummary([], '');

  readonly cartItems$: Observable<CartItem[]> = this.action$.pipe(
    startWith(null as unknown as CartAction),
    scan((acc: CartItem[], action: CartAction) => action ? cartReducer(acc, action) : acc, []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly couponCode$: Observable<string> = this.coupon$.asObservable();

  readonly cartSummary$: Observable<CartSummary> = combineLatest([
    this.cartItems$,
    this.coupon$
  ]).pipe(
    map(([items, coupon]) => computeCartSummary(items, coupon)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.cartItems$.subscribe(items => {
      this.currentItems = items;
    });
    this.cartSummary$.subscribe(summary => {
      this.currentSummary = summary;
    });
  }

  addItem(item: CatalogProduct, qty = 1): void {
    this.action$.next({ type: 'ADD', item, qty });
  }

  removeItem(id: number): void {
    this.action$.next({ type: 'REMOVE', id });
  }

  updateQuantity(id: number, qty: number): void {
    this.action$.next({ type: 'UPDATE_QTY', id, qty });
  }

  clearCart(): void {
    this.action$.next({ type: 'CLEAR' });
  }

  applyCoupon(code: string): void {
    this.coupon$.next(code);
  }

  getItems(): CartItem[] {
    return [...this.currentItems];
  }

  getSummary(): CartSummary {
    return { ...this.currentSummary };
  }
}
