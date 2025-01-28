import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { AuthenticationService } from './providers/authentication.service';
import { DataService } from './providers/data.service';
import { Subject } from 'rxjs/internal/Subject';
import { DestroyManager } from './providers/destroy-manager.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ApiHttpService } from './providers/http.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DestroyManager],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  showNavbar = true;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private authService: AuthenticationService,
    private dataService: DataService,
    private destroyManager: DestroyManager
  ) {}

  menuOpened = false;

  header: string = '';

  userName: string = '';
  isHelpDropdownOpen: boolean = false;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        mergeMap((route) => route.data),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.showNavbar = !data['hideNavbar']; // Hide navbar based on route data
        this.titleService.setTitle(data['title']);
        this.header = data['header'];
      });

    this.dataService
      .getUserId(this.destroyManager)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.userName = data['auth_user_name'];
        this.dataService.setUsername(data['auth_user']);
        this.getUserRoles(data['auth_user']);
      });
  }

  toggleHelpDropdown(event: MouseEvent) {
    this.isHelpDropdownOpen = !this.isHelpDropdownOpen; // Toggle dropdown visibility
    event.stopPropagation(); // Prevent event bubbling
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation(); // Prevent clicks inside dropdown from closing it
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.help-dropdown') && !target.closest('.help-button')) {
      this.isHelpDropdownOpen = false; // Close dropdown if click is outside
    }
  }

  logout() {
    this.authService.ssoLogout();
  }

  userRoles$ = new BehaviorSubject<string[]>([]);
  isAdmin$: Observable<boolean> = this.userRoles$.pipe(
    map((roles) => roles.includes('ADMIN'))
  );
  loading$ = this.userRoles$.pipe(
    map((roles) => roles.length === 0) // Loading if no roles are loaded yet
  );
  getUserRoles(username: string) {
    this.dataService
      .getRoles(username, this.destroyManager)
      .pipe(
        tap(() => (this.loading$ = of(false))),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.userRoles$.next(data['userRoles']);
        this.dataService.setUserRoles(data['userRoles']);
      });
  }
  hasRole$(roles: string[]): Observable<boolean> {
    return this.userRoles$.pipe(
      map((userRoles) => roles.some((role) => userRoles.includes(role)))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
