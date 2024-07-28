import { bootstrapApplication } from '@angular/platform-browser'
import { AppConfig } from './app/app.config'
import { AppComponent } from './app/app.component'
import { enableProdMode, provideZoneChangeDetection } from '@angular/core'
import { environment } from './environments/environment'
import { provideRouter } from '@angular/router'
import { routes } from './app/app.routes'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideAnimations } from '@angular/platform-browser/animations'
import { MessageService } from 'primeng/api'
import { backendHandler } from './app/shared/util-auth/handler/backend.handler'

if (environment.production) {
    enableProdMode()
}

(async (): Promise<void> => {
    await AppConfig.load()

    bootstrapApplication( AppComponent, {
        providers: [
            provideZoneChangeDetection( { eventCoalescing: true } ),
            provideAnimations(),
            provideHttpClient(
                withInterceptors( [ backendHandler ] ),
            ),
            provideRouter( routes ),
            MessageService,
            AppConfig,
            AppConfig.provideOidc(),
            AppConfig.provideNgxs(),
            AppConfig.provideNgxsReduxDevtools(),
            AppConfig.provideTranslator(),
        ],
    } ).catch( (error: Error) => console.error( error ) )
})()
