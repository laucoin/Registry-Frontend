import { DatePipe } from '@angular/common'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { backendHandler } from '@core/authentication/handler/backend.handler'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryComponent } from '@core/layout/registry.component'
import { UserProfileFacade } from '@core/registry/state/user-profile.facade'
import { routes } from '@core/routing/registry.routes'
import { UserFacade } from '@pages/users/data/state/user.facade'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import '@sgdf/ui/avatar'
import '@sgdf/ui/divider'
import '@sgdf/ui/footer'
import '@sgdf/ui/i18n'
import '@sgdf/ui/icon'
import '@sgdf/ui/icon-button'
import '@sgdf/ui/menu'
import '@sgdf/ui/menu-item'
import '@sgdf/ui/nav-item'
import '@sgdf/ui/navbar'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/page-title'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/table'
import '@sgdf/ui/toast'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/relative-time'

bootstrapApplication(RegistryComponent, {
	providers: [
		RegistryConfig.provideRuntimeConfig(),
		provideZonelessChangeDetection(),
		provideHttpClient(withInterceptors([backendHandler])),
		provideRouter(routes),
		UserProfileFacade,
		UserFacade,
		DatePipe,
		DateFormatPipe,
		IntervalPipe,
		ProjectOptionIconPipe,
		CustomDateFormatPipe,
		RegistryConfig,
		RegistryConfig.provideTranslatorService(),
		PluralTranslationPipe,
	],
}).catch((error: Error) => console.error(error))
