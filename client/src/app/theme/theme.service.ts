import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'light-theme' | 'dark-theme' | 'low-light-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme: Theme = 'light-theme';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.initTheme();
  }

  private initTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      this.setTheme(prefersDark ? 'dark-theme' : 'light-theme');
    }
  }

  setTheme(theme: Theme) {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove(this.currentTheme);
      document.body.classList.add(theme);
      this.currentTheme = theme;
    }
  }

  toggleTheme() {
    const themes: Theme[] = ['light-theme', 'dark-theme', 'low-light-theme'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}
