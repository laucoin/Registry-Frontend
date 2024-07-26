import { bootstrapApplication } from '@angular/platform-browser'
import { AppConfig } from './app/app.config'
import { AppComponent } from './app/app.component'
import { enableProdMode, provideZoneChangeDetection } from '@angular/core'
import { environment } from './environments/environment'
import { provideRouter } from '@angular/router'
import { routes } from './app/app.routes'
import { provideHttpClient } from '@angular/common/http'
import { provideAnimations } from '@angular/platform-browser/animations'

if (environment.production) {
    enableProdMode()
}

(async (): Promise<void> => {
    await AppConfig.load()

    bootstrapApplication( AppComponent, {
        providers: [
            provideZoneChangeDetection( { eventCoalescing: true } ),
            provideAnimations(),
            provideHttpClient(),
            provideRouter( routes ),
            AppConfig,
            AppConfig.provideOidc(),
            AppConfig.provideNgxs(),
            AppConfig.provideNgxsReduxDevtools(),
            AppConfig.provideTranslator(),
        ],
    } ).catch( (error: Error) => console.error( error ) )
})()
