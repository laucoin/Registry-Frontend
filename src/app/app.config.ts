import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
	ApplicationConfig,
	inject,
	isDevMode,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '@core/auth/auth.interceptor';
import { ConfigFacade } from '@core/config/config.facade';
import { GlobalErrorFacade } from '@core/error/global-error.facade';
import { DocumentLangService } from '@core/i18n/document-lang.service';
import { TranslationHttpLoader } from '@core/i18n/transloco.loader';
import { DocumentTitleService } from '@core/navigation/document-title.service';
import { NavigationHistoryService } from '@core/navigation/navigation-history.service';
import { provideTransloco } from '@jsverse/transloco';
import { fr_FR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideSessionStorage } from 'ngx-oneforall/services/storage';
import { catchError, firstValueFrom, of } from 'rxjs';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		provideClientHydration(),
		provideHttpClient(withInterceptors([authInterceptor])),
		provideSessionStorage(),
		provideNzI18n(fr_FR),
		provideTransloco({
			config: {
				availableLangs: ['fr', 'en'],
				defaultLang: 'fr',
				fallbackLang: 'fr',
				reRenderOnLangChange: true,
				prodMode: !isDevMode(),
			},
			loader: TranslationHttpLoader,
		}),
		provideAppInitializer(() => {
			const configFacade: ConfigFacade = inject(ConfigFacade);
			const globalErrorFacade: GlobalErrorFacade = inject(GlobalErrorFacade);
			return firstValueFrom(
				configFacade.load().pipe(
					catchError(() => {
						globalErrorFacade.reportConfigLoadFailure();
						return of(undefined);
					}),
				),
			);
		}),
		provideAppInitializer(() => {
			inject(DocumentLangService);
		}),
		provideAppInitializer(() => {
			inject(DocumentTitleService);
		}),
		provideAppInitializer(() => {
			inject(NavigationHistoryService);
		}),
	],
};
