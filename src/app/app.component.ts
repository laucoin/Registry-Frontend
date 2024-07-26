import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ConfirmationService, MessageService, PrimeNGConfig, Translation } from 'primeng/api'
import { AppConfig } from './app.config'
import { Subscription } from 'rxjs'
import { ToastModule } from 'primeng/toast'
import { SideBarComponent } from './shell/side-bar/side-bar.component'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { DOCUMENT } from '@angular/common'

@Component( {
    selector: 'app-root',
    standalone: true,
    imports: [
        TranslateModule,
        ConfirmDialogModule,
        SideBarComponent,
        ToastModule,
        RouterOutlet,
    ],
    providers: [ ConfirmationService, MessageService ],
    template: '<main class="main">' +
              '    <p-confirmDialog />' +
              '    <app-side-bar>' +
              '        <p-toast />' +
              '        <router-outlet />' +
              '    </app-side-bar>' +
              '</main>',
} )
export class AppComponent implements OnInit, OnDestroy {
    private readonly subscriptions: Subscription = new Subscription()

    protected isLight!: boolean
    private themeElement: HTMLLinkElement | undefined

    private readonly themeMediaQuery: MediaQueryList = window.matchMedia(
        '(prefers-color-scheme: light)',
    )

    public constructor (
        @Inject( DOCUMENT )
        private readonly document: Document,
        private readonly translateService: TranslateService,
        private readonly primeConfig: PrimeNGConfig,
    ) { }

    public ngOnInit (): void {
        this.initTheme()
        this.listenThemeChange()
        this.initTranslation()
    }

    private initTheme (): void {
        this.themeElement = this.document.getElementById( 'app-theme' ) as HTMLLinkElement
        this.updateTheme( !window.matchMedia || this.themeMediaQuery.matches )
    }

    private listenThemeChange (): void {
        this.themeMediaQuery.addEventListener( 'change', (e: MediaQueryListEvent): void =>
            this.updateTheme( e.matches ),
        )
    }

    private updateTheme = (isLight: boolean): void => {
        if (!this.themeElement) return
        this.isLight = isLight
        this.themeElement.href = isLight ? 'light.css' : 'dark.css'
    }

    private initTranslation (): void {
        this.translateService.addLangs( AppConfig.config.languages )

        let nextLang: string | undefined

        navigator.languages.forEach( (lang: string): void => {
            if (this.translateService.langs.includes( lang ) && !nextLang) {
                nextLang = lang
            }
        } )

        this.translateService.setDefaultLang( nextLang || AppConfig.config.defaultLanguage )
        this.translateService
            .get( 'primeng' )
            .subscribe( (it: Translation) => this.primeConfig.setTranslation( it ) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
