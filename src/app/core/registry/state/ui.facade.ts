import { computed, inject, Injectable, Signal } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { Observable } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { MetadataStore } from '@core/registry/state/metadata.store'
import { NotificationStore } from '@core/registry/state/notification.store'
import { UiStore } from '@core/registry/state/ui.store'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { StringHelper } from '@shared/helpers/string.helper'

/**
 * Purpose: Public entry point for what the shell displays: theme, screen size, global loader and error, toasts, display options.
 * Scope: Exposes the UI, notification and metadata stores as signals and forwards their commands.
 * Limits: Knows nothing about the user or the session; it does not call the backend.
 */
@Injectable( { providedIn: 'root' } )
export class UiFacade {
    private readonly translateService: TranslocoService = inject( TranslocoService )
    private readonly ui: InstanceType<typeof UiStore> = inject( UiStore )
    private readonly notifications: InstanceType<typeof NotificationStore> = inject( NotificationStore )
    private readonly metadata: InstanceType<typeof MetadataStore> = inject( MetadataStore )

    private readonly onlineMessage: ToastMessageOptions = StateHelper.buildNotificationMessage(
        SeverityEnum.SUCCESS,
        'global.notifications.ONLINE.title',
        'global.notifications.ONLINE.message',
        'pi pi-sort-alt',
    )
    private readonly offlineMessage: ToastMessageOptions = StateHelper.buildNotificationMessage(
        SeverityEnum.WARNING,
        'global.notifications.OFFLINE.title',
        'global.notifications.OFFLINE.message',
        'pi pi-sort-alt-slash',
    )

    public readonly theme: Signal<ThemeEnum> = this.ui.theme
    public readonly tinyScreen: Signal<boolean> = computed( (): boolean => this.ui.screenWidth() < 768 )
    public readonly globalLoading: Signal<boolean> = this.ui.loading
    public readonly globalError: Signal<ToastMessageOptions | undefined> = this.ui.error
    private readonly online: Signal<boolean | undefined> = this.ui.online

    public readonly logoPath: Signal<string> = computed( (): string => {
        switch (true) {
            case this.theme() === ThemeEnum.DARK && this.tinyScreen():
                return RegistryConfig.config.logo.small.dark
            case this.theme() === ThemeEnum.DARK && !this.tinyScreen():
                return RegistryConfig.config.logo.normal.dark
            case this.theme() === ThemeEnum.LIGHT && this.tinyScreen():
                return RegistryConfig.config.logo.small.light
            default:
                return RegistryConfig.config.logo.normal.light
        }
    } )

    public readonly notification: Observable<ToastMessageOptions> = this.notifications.messages$()

    public readonly themesMetadata: Signal<SelectItem<ThemeEnum>[]> = this.metadata.themes
    public readonly languagesMetadata: Signal<SelectItem<string>[]> = computed( (): SelectItem<string>[] =>
        this.metadata.languages().map( (lang: SelectItem<string>): SelectItem<string> => ({
            ...lang,
            label: this.translateService.translate( lang.label! ),
        }) ),
    )

    public startGlobalLoader (): void {
        this.ui.startGlobalLoader()
    }

    public stopGlobalLoader (): void {
        this.ui.stopGlobalLoader()
    }

    public setGlobalError (error: ErrorModel): void {
        this.ui.setGlobalError( error )
    }

    public updateNetwork (online: boolean): void {
        if (this.online() != undefined) {
            this.notify( online ? this.onlineMessage : this.offlineMessage )
        }
        this.ui.updateNetwork( online )
    }

    public updateScreenWidth (screenWidth: number): void {
        this.ui.updateScreenWidth( screenWidth )
    }

    public updateLanguage (language: string): void {
        this.ui.updateLanguage( language )
    }

    public updateTheme (theme: ThemeEnum | undefined): void {
        if (GenericHelper.nonNull( theme )) {
            this.ui.updateTheme( theme! )
        }
    }

    public notify (message: ToastMessageOptions): void {
        if (message.summary?.endsWith( '401' )) {
            return
        }

        let formattedMessage: ToastMessageOptions = message
        if (StringHelper.isNullOrBlank( message.detail ) && StringHelper.isNullOrBlank( message.summary )) {
            formattedMessage = {
                ...message,
                detail: this.translateService.translate( 'global.notifications.UNKNOWN_ERROR' ),
            }
        }

        this.notifications.notify( formattedMessage )
    }
}
