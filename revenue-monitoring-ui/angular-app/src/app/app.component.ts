import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, takeUntil } from 'rxjs/operators';
import { AuthenticationService } from './providers/authentication.service';
import { DataService } from './providers/data.service';
import { Subject } from 'rxjs/internal/Subject';
import { DestroyManager } from './providers/destroy-manager.service';

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
  userName: string = this.authService.getUserName();
  isHelpDropdownOpen: boolean = false;
  userRoles: string[] = this.authService.getRoles();
  isAdmin$: boolean = this.userRoles.includes('ADMIN');
  showMenu: boolean = true;
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
        this.dataService.setHeader(data['header']);
        const hiddenRoutes = ['/home', '/error']; // Define routes where menu should be hidden
        this.showMenu = !hiddenRoutes.includes(this.router.url);
      });

    this.dataService
      .getExceptionAssignmentUsers(this.destroyManager)
      .subscribe((data) => {
        this.dataService.setAssignmentUsers(data);
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

  hasRole$(roles: string[]) {
    return roles.some((role) => this.userRoles.includes(role));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
