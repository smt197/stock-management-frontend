import { Injectable, signal, effect, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private renderer: Renderer2;

  isDarkTheme = signal<boolean>(this.getInitialTheme());

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Effect to react to theme changes
    effect(() => {
      const isDark = this.isDarkTheme();
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
      if (isDark) {
        this.renderer.addClass(document.body, 'dark-theme');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme');
      }
    });
  }

  private getInitialTheme(): boolean {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(this.THEME_KEY);
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      // Default to system preference if no theme is stored
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Default for non-browser environments
  }

  toggleTheme(): void {
    this.isDarkTheme.update(value => !value);
  }
}
