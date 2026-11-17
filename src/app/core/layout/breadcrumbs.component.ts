import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchService } from '../services/search.service';

interface BreadcrumbItem {
  label: string;
  url: string;
  isLast: boolean;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss'
})
export class BreadcrumbsComponent {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  readonly crumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.updateBreadcrumbs(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.updateBreadcrumbs(event.urlAfterRedirects);
      });
  }

  private updateBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    const items: BreadcrumbItem[] = [
      { label: 'Home', url: '/', isLast: segments.length === 0 }
    ];

    if (segments.length > 0) {
      const moduleKey = segments[0];
      const navGroups = this.searchService.navGroups();
      const currentGroup = navGroups.find(g => g.basePath === `/${moduleKey}`);

      if (currentGroup) {
        items.push({
          label: `Module ${currentGroup.moduleNumber}: ${currentGroup.title}`,
          url: currentGroup.basePath,
          isLast: segments.length === 1
        });

        if (segments.length > 1) {
          const topicPath = `/${segments[0]}/${segments[1]}`;
          const currentTopic = currentGroup.topics.find(t => t.path === topicPath);
          items.push({
            label: currentTopic ? currentTopic.title : segments[1],
            url: topicPath,
            isLast: true
          });
        }
      } else {
        // Fallback for custom routes
        let accumulatedUrl = '';
        segments.forEach((seg, idx) => {
          accumulatedUrl += `/${seg}`;
          items.push({
            label: seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            url: accumulatedUrl,
            isLast: idx === segments.length - 1
          });
        });
      }
    }

    this.crumbs.set(items);
  }
}
