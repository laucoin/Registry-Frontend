import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { catchError, combineLatest, EMPTY, map, Observable, of, Subject, switchMap } from 'rxjs';

import { BrowserService } from '@core/browser/browser.service';
import { PageSeoModel, RouteSeoModel, SEO_DATA_KEY } from '@core/seo/route-seo.model';

const APPLICATION_NAME = 'Registry';
const NOINDEX_DIRECTIVE = 'noindex, nofollow';
const INDEX_DIRECTIVE = 'index, follow';
const SHARING_IMAGE_PATH = '/img/login-hero.webp';
const SHARING_IMAGE_WIDTH = '1440';
const SHARING_IMAGE_HEIGHT = '1080';
const SEO_META_NAMES: readonly string[] = ['description', 'twitter:card', 'twitter:image'];
const SEO_META_PROPERTIES: readonly string[] = [
	'og:title',
	'og:description',
	'og:type',
	'og:url',
	'og:locale',
	'og:image',
	'og:image:width',
	'og:image:height',
];

interface TranslatedPage extends PageSeoModel {
	title: string;
	description?: string;
}

/**
 * Purpose: Positionne le titre du document et les métadonnées pour les moteurs de recherche de la route active, dans la langue active.
 * Scope: Traduit le titre de la route, publie les balises description, Open Graph, Twitter et canonical pour les routes publiques, et marque toute autre route noindex.
 * Limits: Ne décide pas des routes publiques (une route est publique quand ses données portent une clé de description) et ne construit pas le sitemap.
 */
@Injectable({ providedIn: 'root' })
export class RegistryTitleStrategy extends TitleStrategy {
	private readonly title = inject(Title);
	private readonly meta = inject(Meta);
	private readonly translator = inject(TranslocoService);
	private readonly browser = inject(BrowserService);
	private readonly pages = new Subject<PageSeoModel>();

	constructor() {
		super();
		this.pages
			.pipe(
				switchMap((it) => this.translate$(it)),
				takeUntilDestroyed(),
			)
			.subscribe((it) => this.apply(it));
	}

	public override updateTitle(snapshot: RouterStateSnapshot): void {
		const titleKey = this.buildTitle(snapshot);
		if (titleKey === undefined) return;
		this.pages.next({
			titleKey,
			url: this.canonicalUrl(snapshot),
			descriptionKey: this.seoOf(snapshot)?.descriptionKey,
		});
	}

	private translate$(page: PageSeoModel): Observable<TranslatedPage> {
		return combineLatest([this.translator.selectTranslate(page.titleKey), this.descriptionOf$(page)]).pipe(
			map(([title, description]: [string, string | undefined]): TranslatedPage => ({
				...page,
				title,
				description,
			})),
			catchError(() => EMPTY),
		);
	}

	private descriptionOf$(page: PageSeoModel): Observable<string | undefined> {
		return page.descriptionKey ? this.translator.selectTranslate(page.descriptionKey) : of(undefined);
	}

	private apply(page: TranslatedPage): void {
		this.title.setTitle(`${page.title} · ${APPLICATION_NAME}`);
		this.clearSharingTags();
		if (page.description === undefined) {
			this.meta.updateTag({ name: 'robots', content: NOINDEX_DIRECTIVE });
			this.browser.setCanonicalLink(undefined);
		} else {
			this.meta.updateTag({ name: 'robots', content: INDEX_DIRECTIVE });
			this.browser.setCanonicalLink(page.url);
			this.publishSharingTags(page.title, page.description, page.url);
		}
	}

	private publishSharingTags(title: string, description: string, url: string): void {
		this.meta.addTags([
			{ name: 'description', content: description },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:image', content: this.sharingImageUrl() },
			{ property: 'og:title', content: title },
			{ property: 'og:description', content: description },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:url', content: url },
			{ property: 'og:locale', content: this.translator.getActiveLang() },
			{ property: 'og:image', content: this.sharingImageUrl() },
			{ property: 'og:image:width', content: SHARING_IMAGE_WIDTH },
			{ property: 'og:image:height', content: SHARING_IMAGE_HEIGHT },
		]);
	}

	private sharingImageUrl(): string {
		return `${this.browser.origin}${SHARING_IMAGE_PATH}`;
	}

	private clearSharingTags(): void {
		SEO_META_NAMES.forEach((it) => this.meta.removeTag(`name='${it}'`));
		SEO_META_PROPERTIES.forEach((it) => this.meta.removeTag(`property='${it}'`));
	}

	private canonicalUrl(snapshot: RouterStateSnapshot): string {
		return `${this.browser.origin}${snapshot.url.split(/[?#]/)[0]}`;
	}

	private seoOf(snapshot: RouterStateSnapshot): RouteSeoModel | undefined {
		let route = snapshot.root;
		while (route.firstChild) route = route.firstChild;
		return route.data[SEO_DATA_KEY] as RouteSeoModel | undefined;
	}
}
