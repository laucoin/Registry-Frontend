import { Injectable } from '@angular/core';

const DARK_LINK_ID: string = 'theme-dark-link';
const DARK_HREF: string = 'theme-dark.css';

@Injectable({ providedIn: 'root' })
export class ThemeToggleService {
	private readonly darkLink: HTMLLinkElement = this.ensureDarkLink();

	private ensureDarkLink(): HTMLLinkElement {
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
		this.darkLink.disabled = !dark;
	}
}
