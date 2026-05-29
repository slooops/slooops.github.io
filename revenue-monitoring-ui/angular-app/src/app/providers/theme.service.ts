import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = 'fit-dark-mode';
  private darkMode$ = new BehaviorSubject<boolean>(false);
  private mediaQuery: MediaQueryList;
  private mediaListener: (e: MediaQueryListEvent) => void;

  /** Whether dark mode is currently active */
  isDarkMode$ = this.darkMode$.asObservable();

  /** Whether the current route supports dark mode */
  private _routeSupportsDarkMode = false;

  get routeSupportsDarkMode(): boolean {
    return this._routeSupportsDarkMode;
  }

  set routeSupportsDarkMode(value: boolean) {
    this._routeSupportsDarkMode = value;
    if (!value && this.darkMode$.value) {
      this.darkMode$.next(false);
    }
  }

  get isDarkMode(): boolean {
    return this.darkMode$.value;
  }

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaListener = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a manual preference
      if (localStorage.getItem(this.STORAGE_KEY) === null) {
        this.darkMode$.next(e.matches);
      }
    };
    this.mediaQuery.addEventListener('change', this.mediaListener);

    // Initialize: check localStorage first, then system preference
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored !== null) {
      this.darkMode$.next(stored === 'true');
    } else {
      this.darkMode$.next(this.mediaQuery.matches);
    }

    // Mirror dark state onto <body> so global styles (page background, etc.)
    // can respond even outside any component host.
    this.darkMode$.subscribe((dark) => {
      document.body.classList.toggle('dark-theme', dark);
    });
  }

  toggle(): void {
    const next = !this.darkMode$.value;
    this.darkMode$.next(next);
    localStorage.setItem(this.STORAGE_KEY, String(next));
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.mediaListener);
  }
}
