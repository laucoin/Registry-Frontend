import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { enableProdMode, provideZoneChangeDetection } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { MessageService } from 'primeng/api'
import { AppComponent } from './app/app.component'
import { AppConfig } from './app/app.config'
import { routes } from './app/app.routes'
import { backendHandler } from './app/shared/util-authentication/handler/backend.handler'
import { RegistryFacade } from './app/shared/util-common/state/registry.facade'
import { DatePipe } from '@angular/common'
import { UserFacade } from './app/domains/user/data/state/user.facade'

(async (): Promise<void> => {
    await AppConfig.load()

    if (AppConfig.config.production) {
        enableProdMode()
    }

    bootstrapApplication( AppComponent, {
        providers: [
            provideZoneChangeDetection( { eventCoalescing: true } ),
            provideAnimations(),
            provideHttpClient(),
            provideHttpClient( withInterceptors( [ backendHandler ] ) ),
            provideRouter( routes ),
            MessageService,
            RegistryFacade,
            UserFacade,
            DatePipe,
            AppConfig,
            AppConfig.provideNgxs(),
            AppConfig.provideNgxsReduxDevtools(),
            AppConfig.provideTranslator(),
        ],
    } ).catch( (error: Error) => console.error( error ) )
})()
