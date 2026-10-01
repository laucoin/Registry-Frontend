import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { StringHelper } from '@shared/helpers/string.helper';
import { filter, map, Observable, of, switchMap } from 'rxjs';

const APP_NAME: string = 'Registry';

@Injectable({ providedIn: 'root' })
/**
 * Purpose: Keeps the browser tab title in sync with the deepest active route's translated `title` data.
 * Scope: Subscribes to router navigation end events for the component's lifetime; wired at the composition root.
 * Limits: Reads only the `data.title` i18n key convention; does not manage route data itself.
 */
export class DocumentTitleService {
	private readonly _title: Title = inject(Title);
	private readonly _router: Router = inject(Router);
	private readonly _translateService: TranslocoService = inject(TranslocoService);
	private readonly _destroyRef: DestroyRef = inject(DestroyRef);

	public constructor() {
		this._router.events
			.pipe(
				filter((event: unknown): event is NavigationEnd => event instanceof NavigationEnd),
				map(() => this._deepestTitleKey()),
				switchMap((key: string | undefined) => this._translateTitleKey(key)),
				takeUntilDestroyed(this._destroyRef),
			)
			.subscribe((label: string | undefined) => {
				this._title.setTitle(label ? `${label} · ${APP_NAME}` : APP_NAME);
			});
	}

	private _translateTitleKey(key: string | undefined): Observable<string | undefined> {
		if (StringHelper.isBlank(key)) {
			return of(undefined);
		}

		return this._translateService.selectTranslate<string>(
			key!.slice(key!.indexOf('.') + 1),
			{},
			key!.slice(0, key!.indexOf('.')),
		)
	}

	private _deepestTitleKey(): string | undefined {
		let route: ActivatedRouteSnapshot = this._router.routerState.snapshot.root;
		while (route.firstChild) {
			route = route.firstChild;
		}
		return route.data['title'] as string | undefined;
	}
}
