import {provideHttpClient, withInterceptors} from '@angular/common/http'
import {enableProdMode, provideZoneChangeDetection} from '@angular/core'
import {bootstrapApplication} from '@angular/platform-browser'
import {provideRouter} from '@angular/router'
import {MessageService} from 'primeng/api'
import {RegistryComponent} from '@core/layout/registry.component'
import {RegistryConfig} from '@core/config/registry.config'
import {routes} from '@core/routing/registry.routes'
import {backendHandler} from '@core/authentication/handler/backend.handler'
import {RegistryFacade} from '@core/registry/state/registry.facade'
import {UserFacade} from '@pages/users/data/state/user.facade'
import {DatePipe} from '@angular/common'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {CustomDateFormatPipe} from '@shared/helpers/pipe/custom-date-format.pipe'
import {ProjectOptionIconPipe} from '@shared/helpers/pipe/project-option-icon.pipe'
import {IntervalPipe} from '@shared/helpers/pipe/interval.pipe'

(async (): Promise<void> => {
    await RegistryConfig.load()

    if (RegistryConfig.environment.production) {
        enableProdMode()
    }

    bootstrapApplication(RegistryComponent, {
        providers: [
            provideZoneChangeDetection({eventCoalescing: true}),
            provideHttpClient(),
            provideHttpClient(withInterceptors([backendHandler])),
            provideRouter(routes),
            MessageService,
            RegistryFacade,
            UserFacade,
            DatePipe,
            DateFormatPipe,
            IntervalPipe,
            ProjectOptionIconPipe,
            CustomDateFormatPipe,
            RegistryConfig,
            RegistryConfig.providePrimeNg(),
            RegistryConfig.provideTranslatorService(),
            RegistryConfig.provideTranslatorHttpLoader(),
            PluralTranslationPipe,
        ],
    }).catch((error: Error) => console.error(error))
})()
