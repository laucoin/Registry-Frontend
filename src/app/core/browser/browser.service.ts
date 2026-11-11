import { ElementRef, Injectable } from '@angular/core';

import { ThemeEnum } from '@shared/models/enumeration/theme.enum';

const THEME_ATTRIBUTE = 'data-sgdf-mode';
const HIGHLIGHT_CLASS = 'highlight';
const HIGHLIGHT_DURATION_MS = 1000;
export const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Objectif: Point d'accès unique aux globaux du navigateur dont dépend l'application.
 * Périmètre: Enveloppe location, historique, plateforme, viewport, scroll, visibilité de la page, intersection d'éléments, accès à l'élément natif d'une ElementRef, schéma de couleurs, cookies, attributs de l'élément racine, lien canonical et recherche d'éléments.
 * Limites: Ne détient aucun état et n'applique aucune logique applicative ; ne gère pas le stockage (voir les helpers de stockage).
 */
@Injectable({ providedIn: 'root' })
export class BrowserService {
	private colorSchemeQuery: MediaQueryList | undefined;

	public get pathname(): string {
		return location.pathname;
	}

	public get relativeUrl(): string {
		return `${location.pathname}${location.search}${location.hash}`;
	}

	public get origin(): string {
		return location.origin;
	}

	public get host(): string {
		return location.host;
	}

	public get online(): boolean {
		return navigator.onLine;
	}

	public get viewportWidth(): number {
		return window.innerWidth;
	}

	public get pageVisible(): boolean {
		return document.visibilityState !== 'hidden';
	}

	public get preferredLanguages(): readonly string[] {
		return navigator.languages;
	}

	public get isApplePlatform(): boolean {
		return /Mac|iPhone|iPad/.test(navigator.userAgent);
	}

	public get historyState(): unknown {
		return history.state;
	}

	public get systemTheme(): ThemeEnum {
		return this.lightSchemeQuery?.matches === false ? ThemeEnum.DARK : ThemeEnum.LIGHT;
	}

	public elementOf<T extends Element>(ref: ElementRef<T>): T {
		return ref.nativeElement;
	}

	public onViewportResize(listener: (width: number) => void): () => void {
		const onResize: () => void = () => listener(window.innerWidth);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}

	public onVisibilityChange(listener: (visible: boolean) => void): () => void {
		const onChange: () => void = () => listener(this.pageVisible);
		document.addEventListener('visibilitychange', onChange);
		return () => document.removeEventListener('visibilitychange', onChange);
	}

	public observeIntersection(element: Element, listener: (visible: boolean) => void): () => void {
		if (typeof IntersectionObserver !== 'function') {
			listener(true);
			return (): void => undefined;
		}
		const observer = new IntersectionObserver((entries) => listener(entries[entries.length - 1].isIntersecting));
		observer.observe(element);
		return () => observer.disconnect();
	}

	public watchIntersection(
		element: Element,
		listener: (intersecting: boolean) => void,
		rootMargin?: string,
	): () => void {
		if (typeof IntersectionObserver !== 'function') return (): void => undefined;
		const observer = new IntersectionObserver((entries) => listener(entries.some((it) => it.isIntersecting)), {
			rootMargin: rootMargin,
		});
		observer.observe(element);
		return () => observer.disconnect();
	}

	public redirect(url: string): void {
		window.location.href = url;
	}

	public downloadJson(content: unknown, filename: string): void {
		const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url));
	}

	public reload(): void {
		location.reload();
	}

	public setRootTheme(theme: ThemeEnum): void {
		if (theme === ThemeEnum.SYSTEM) {
			document.documentElement.removeAttribute(THEME_ATTRIBUTE);
		} else {
			document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
		}
	}

	public setCanonicalLink(url: string | undefined): void {
		document.head.querySelector('link[rel="canonical"]')?.remove();
		if (url === undefined) return;
		const link = document.createElement('link');
		link.rel = 'canonical';
		link.href = url;
		document.head.appendChild(link);
	}

	public readCookie(name: string): string | undefined {
		const prefix = `${name}=`;
		const entry = document.cookie.split('; ').find((it) => it.startsWith(prefix));
		return entry ? decodeURIComponent(entry.substring(prefix.length)) : undefined;
	}

	public writeCookie(name: string, value: string, maxAgeSeconds: number): void {
		const secure: string = location.protocol === 'https:' ? '; Secure' : '';
		document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
	}

	public setRootLanguage(language: string): void {
		document.documentElement.lang = language;
	}

	public highlightByDataValue(value: string, root: ParentNode = document): void {
		const element: HTMLElement | null = root.querySelector(`[data-value="${CSS.escape(value)}"]`);
		if (element) {
			element.classList.add(HIGHLIGHT_CLASS);
			setTimeout(() => element.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_DURATION_MS);
		}
	}

	private get lightSchemeQuery(): MediaQueryList | undefined {
		if (typeof window.matchMedia !== 'function') {
			return undefined;
		}
		return (this.colorSchemeQuery ??= window.matchMedia('(prefers-color-scheme: light)'));
	}
}
