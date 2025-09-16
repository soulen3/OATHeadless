import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ThemeService } from './theme/theme.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { MessageConsoleComponent } from './message-console/message-console.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MessageConsoleComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  title = '';
  constructor(
    private themeService: ThemeService,
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.setPageTitle();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.setPageTitle();
      });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  private setPageTitle() {
    let child = this.activatedRoute.firstChild;
    while (child) {
      if (child.snapshot.data['title']) {
        this.titleService.setTitle(child.snapshot.data['title']);
        this.title =
          child.snapshot.data['title'] === 'OATHeadless'
            ? ''
            : child.snapshot.data['title'];
        return;
      }
      child = child.firstChild;
    }
    this.titleService.setTitle(this.title);
  }
}
