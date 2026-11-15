import { DatePipe } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';

import { backendHandler } from '@core/authentication/handler/backend.handler';
import { RegistryConfig } from '@core/config/registry.config';
import { RegistryComponent } from '@core/layout/registry.component';
import { routes } from '@core/routing/registry.routes';
import { RegistryTitleStrategy } from '@core/seo/registry-title.strategy';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe';

import '@sgdf/ui/i18n';

bootstrapApplication(RegistryComponent, {
	providers: [
		RegistryConfig.provideRuntimeConfig(),
		provideZonelessChangeDetection(),
		provideHttpClient(withInterceptors([backendHandler])),
		provideRouter(routes),
		{ provide: TitleStrategy, useClass: RegistryTitleStrategy },
		DatePipe,
		DateFormatPipe,
		IntervalPipe,
		ProjectOptionIconPipe,
		CustomDateFormatPipe,
		RegistryConfig.provideTranslatorService(),
		PluralTranslationPipe,
	],
}).catch((error: Error) => console.error(error));
