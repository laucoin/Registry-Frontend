import { Injectable } from '@angular/core';

const DARK_LINK_ID: string = 'theme-dark-link';
const DARK_HREF: string = 'theme-dark.css';

@Injectable({ providedIn: 'root' })
/**
 * Purpose: Toggles the compiled dark/light LESS theme bundle by flipping a disabled stylesheet `<link>`.
 * Scope: Owns the single dark-theme `<link>` element and the `data-theme` attribute on `<html>`.
 * Limits: Re-skinning still requires a rebuild — this only switches between the two pre-built bundles, browser-only.
 */
export class ThemeToggleService {
	private readonly _darkLink: HTMLLinkElement = this._ensureDarkLink();

	private _ensureDarkLink(): HTMLLinkElement {
		let link: HTMLLinkElement | null = document.getElementById(
			DARK_LINK_ID,
		) as HTMLLinkElement | null;
		if (!link) {
			link = document.createElement('link');
			link.id = DARK_LINK_ID;
			link.rel = 'stylesheet';
			link.href = DARK_HREF;
			link.disabled = true;
			document.head.appendChild(link);
		}
		return link;
	}

	public apply(dark: boolean): void {
		document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
		this._darkLink.disabled = !dark;
	}
}
