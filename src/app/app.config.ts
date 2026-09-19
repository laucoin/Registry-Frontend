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
import { routes } from '@app/app.routes';
import { authInterceptor } from '@features/auth/auth.interceptor';
import { ConfigFacade } from '@features/config/config.facade';
import { DocumentLangService } from '@features/i18n/document-lang.service';
import { TranslationHttpLoader } from '@features/i18n/transloco.loader';
import { provideTransloco } from '@jsverse/transloco';
import { fr_FR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { firstValueFrom } from 'rxjs';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		provideClientHydration(),
		provideHttpClient(withInterceptors([authInterceptor])),
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
		provideAppInitializer(() => firstValueFrom(inject(ConfigFacade).load())),
		provideAppInitializer(() => {
			inject(DocumentLangService);
		}),
	],
};
