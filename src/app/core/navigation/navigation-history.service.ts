import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
/**
 * Purpose: Tracks the previous/current URL to support a "go back" action with a fallback.
 * Scope: Passively observes router navigation events for its own lifetime; `goBack()` is the only mutation it triggers.
 * Limits: Only remembers one step of history (previous URL), not a full navigation stack.
 */
export class NavigationHistoryService {
	private readonly _router: Router = inject(Router);
	private _previousUrl: string | undefined;
	private _currentUrl: string | undefined;

	public constructor() {
		this._router.events
			.pipe(filter((event: unknown): event is NavigationEnd => event instanceof NavigationEnd))
			.subscribe((event: NavigationEnd) => {
				this._previousUrl = this._currentUrl;
				this._currentUrl = event.urlAfterRedirects;
			});
	}

	public goBack(fallbackUrl: string): void {
		this._router
			.navigateByUrl(this._previousUrl ?? fallbackUrl)
			.catch((err: Error) => console.error(err));
	}
}
