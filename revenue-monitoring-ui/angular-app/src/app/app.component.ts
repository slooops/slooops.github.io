import { Component, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { AuthenticationService } from './providers/authentication.service';
import { DataService } from './providers/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private authService: AuthenticationService,
    private dataService: DataService
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
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        this.titleService.setTitle(data['title']);
        this.header = data['header'];
      });

    this.dataService.getUserId().subscribe((data) => {
      this.userName = data['auth_user_name'];
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
}
