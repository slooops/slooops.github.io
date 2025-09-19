import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
export abstract class BaseComponent implements OnDestroy {
  /**
   * Subject that emits when the component is destroyed
   * Use this with takeUntil() in your subscriptions
   */
  protected destroy$ = new Subject<void>();

  /**
   * Automatically completes and cleans up the destroy$ subject
   * Called automatically when the component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
