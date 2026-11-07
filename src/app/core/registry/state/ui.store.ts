import { inject } from '@angular/core';

import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

import { BrowserService, PREFERENCE_COOKIE_MAX_AGE_SECONDS } from '@core/browser/browser.service';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { ErrorModel } from '@shared/models/model/error.model';
import { NotificationModel } from '@shared/models/model/notification.model';

const THEME_COOKIE = 'registry-theme';

function storedTheme(browser: BrowserService): ThemeEnum | undefined {
	const stored = browser.readCookie(THEME_COOKIE);
	return Object.values(ThemeEnum).find((it) => it === stored);
}

interface UiStoreModel {
	theme: ThemeEnum;
	refreshMode: RefreshModeEnum;
	screenWidth: number;
	online: boolean | undefined;
	pendingLanguage: string | undefined;
	error: NotificationModel | undefined;
}

/**
 * Purpose: Détient l'état d'affichage de la coque : thème, mode de rafraîchissement, largeur d'écran, réseau, changement de langue en cours et erreur.
 * Scope: Possède cet état, mémorise le thème dans un cookie pour la prochaine visite, suit la largeur du viewport et applique le thème sur le document via le service du navigateur.
 * Limits: Ne sait rien de l'utilisateur ni de la session et n'appelle pas le backend.
 */
export const UiStore = signalStore(
	{ providedIn: 'root' },
	withState<UiStoreModel>(() => {
		const browser = inject(BrowserService);
		return {
			theme: storedTheme(browser) ?? browser.systemTheme,
			refreshMode: RefreshModeEnum.NORMAL,
			screenWidth: browser.viewportWidth,
			online: undefined,
			pendingLanguage: undefined,
			error: undefined,
		};
	}),
	withMethods((store, browser: BrowserService = inject(BrowserService)) => ({
		setGlobalError: (error: ErrorModel) => {
			if (store.error()) return;
			patchState(store, {
				error: {
					severity: 'error',
					summary: error.title,
					detail: error.message,
					closable: true,
				},
			});
		},
		startLanguageChange: (language: string) => patchState(store, { pendingLanguage: language }),
		stopLanguageChange: () => patchState(store, { pendingLanguage: undefined }),
		updateRefreshMode: (refreshMode: RefreshModeEnum) => patchState(store, { refreshMode: refreshMode }),
		updateNetwork: (online: boolean) => patchState(store, { online: online }),
		updateTheme: (theme: ThemeEnum) => {
			browser.setRootTheme(theme);
			browser.writeCookie(THEME_COOKIE, theme, PREFERENCE_COOKIE_MAX_AGE_SECONDS);
			patchState(store, { theme: theme });
		},
	})),
	withHooks((store, browser: BrowserService = inject(BrowserService)) => {
		let stopFollowingViewport: (() => void) | undefined;
		return {
			onInit: () => {
				const remembered = storedTheme(browser);
				if (remembered) {
					browser.setRootTheme(remembered);
				}
				stopFollowingViewport = browser.onViewportResize((width) => patchState(store, { screenWidth: width }));
			},
			onDestroy: (): void => stopFollowingViewport?.(),
		};
	}),
);
