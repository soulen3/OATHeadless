import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme = 'light-theme'; // default theme

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initTheme();
  }

  private initTheme() {
    // Check if we are in the browser before accessing window
    if (isPlatformBrowser(this.platformId)) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      this.setTheme(prefersDark ? 'dark-theme' : 'light-theme');
    }
  }

  setTheme(theme: 'light-theme' | 'dark-theme') {
    // Check if we are in the browser before accessing document
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove(this.currentTheme);
      document.body.classList.add(theme);
      this.currentTheme = theme;
    }
  }

  toggleTheme() {
    const newTheme =
      this.currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
    this.setTheme(newTheme); // Set the new theme
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}
