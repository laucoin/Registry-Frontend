import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { enableProdMode, provideZoneChangeDetection } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { MessageService } from 'primeng/api'
import { AppComponent } from './app/app.component'
import { AppConfig } from './app/app.config'
import { routes } from './app/app.routes'
import { backendHandler } from './app/shared/util-authentication/handler/backend.handler'
import { RegistryFacade } from './app/shared/util-common/state/registry.facade'
import { UserFacade } from './app/domains/user/data/state/user.facade'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import {
    RegistryNgxsUnhandledErrorHandler,
} from './app/shared/util-config/handler/registry-ngxs-unhandled-error.handler'
import { withNgxsPlugin } from '@ngxs/store'
import { DatePipe } from '@angular/common'
import { DateFormatPipe } from './app/shared/util-tool/pipe/date-format.pipe'
import { PluralTranslationPipe } from './app/shared/util-tool/pipe/plural-translation.pipe'
import { CustomDateFormatPipe } from './app/shared/util-tool/pipe/custom-date-format.pipe'
import { ProjectOptionIconPipe } from './app/shared/util-tool/pipe/project-option-icon.pipe'
import { IntervalPipe } from './app/shared/util-tool/pipe/interval.pipe'

(async (): Promise<void> => {
    await AppConfig.load()

    if (AppConfig.settings.production) {
        enableProdMode()
    }

    bootstrapApplication( AppComponent, {
        providers: [
            provideZoneChangeDetection( { eventCoalescing: true } ),
            provideAnimationsAsync(),
            provideHttpClient(),
            provideHttpClient( withInterceptors( [ backendHandler ] ) ),
            provideRouter( routes ),
            MessageService,
            RegistryFacade,
            UserFacade,
            DatePipe,
            DateFormatPipe,
            IntervalPipe,
            ProjectOptionIconPipe,
            CustomDateFormatPipe,
            AppConfig,
            AppConfig.providePrimeNg(),
            AppConfig.provideNgxs(),
            AppConfig.provideNgxsReduxDevtools(),
            withNgxsPlugin( RegistryNgxsUnhandledErrorHandler ),
            AppConfig.provideTranslator(),
            PluralTranslationPipe,
        ],
    } ).catch( (error: Error) => console.error( error ) )
})()
