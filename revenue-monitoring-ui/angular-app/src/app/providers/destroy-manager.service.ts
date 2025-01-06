import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class DestroyManager implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  get destroyObservable() {
    return this.destroy$.asObservable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
