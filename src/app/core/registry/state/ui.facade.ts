import { computed, inject, Injectable, Signal } from '@angular/core'
import { BrowserService } from '@core/browser/browser.service'
import { MetadataStore } from '@core/registry/state/metadata.store'
import { NotificationStore } from '@core/registry/state/notification.store'
import { UiStore } from '@core/registry/state/ui.store'
import { TranslocoService } from '@jsverse/transloco'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { Observable } from 'rxjs'

/**
 * Purpose: Public entry point for what the shell displays: theme, screen size, global loader and error, language change in flight, toasts, display options.
 * Scope: Exposes the UI, notification and metadata stores as signals and forwards their commands.
 * Limits: Knows nothing about the user or the session; it does not call the backend.
 */
@Injectable({ providedIn: 'root' })
export class UiFacade {
	private readonly translateService: TranslocoService = inject(TranslocoService)
	private readonly browser: BrowserService = inject(BrowserService)
	private readonly ui: InstanceType<typeof UiStore> = inject(UiStore)
	private readonly notifications: InstanceType<typeof NotificationStore> = inject(NotificationStore)
	private readonly metadata: InstanceType<typeof MetadataStore> = inject(MetadataStore)

	private readonly onlineMessage: NotificationModel = StateHelper.buildNotificationMessage(
		SeverityEnum.SUCCESS,
		'global.notifications.ONLINE.title',
		'global.notifications.ONLINE.message',
		'pi pi-sort-alt',
	)
	private readonly offlineMessage: NotificationModel = StateHelper.buildNotificationMessage(
		SeverityEnum.WARNING,
		'global.notifications.OFFLINE.title',
		'global.notifications.OFFLINE.message',
		'pi pi-sort-alt-slash',
	)

	public readonly theme: Signal<ThemeEnum> = this.ui.theme
	public readonly tinyScreen: Signal<boolean> = computed((): boolean => this.ui.screenWidth() < 768)
	public readonly globalLoading: Signal<boolean> = this.ui.loading
	public readonly pendingLanguage: Signal<string | undefined> = this.ui.pendingLanguage
	public readonly globalError: Signal<NotificationModel | undefined> = this.ui.error
	private readonly online: Signal<boolean | undefined> = this.ui.online

	public readonly notification: Observable<NotificationModel> = this.notifications.messages$()
	public readonly confirmation: Observable<ConfirmationModel> = this.notifications.confirmations$()

	public readonly themesMetadata: Signal<SelectOptionModel<ThemeEnum>[]> = this.metadata.themes
	public readonly languagesMetadata: Signal<SelectOptionModel<string>[]> = computed((): SelectOptionModel<string>[] =>
		this.metadata.languages().map((lang: SelectOptionModel<string>): SelectOptionModel<string> => ({
			...lang,
			label: this.translateService.translate(lang.label!),
		})),
	)

	public startGlobalLoader(): void {
		this.ui.startGlobalLoader()
	}

	public stopGlobalLoader(): void {
		this.ui.stopGlobalLoader()
	}

	public startLanguageChange(language: string): void {
		this.ui.startLanguageChange(language)
	}

	public stopLanguageChange(): void {
		this.ui.stopLanguageChange()
	}

	public setGlobalError(error: ErrorModel): void {
		this.ui.setGlobalError(error)
	}

	public reloadApplication(): void {
		this.browser.reload()
	}

	public updateNetwork(online: boolean): void {
		if (this.online() != undefined) {
			this.notify(online ? this.onlineMessage : this.offlineMessage)
		}
		this.ui.updateNetwork(online)
	}

	public updateScreenWidth(screenWidth: number): void {
		this.ui.updateScreenWidth(screenWidth)
	}

	public updateTheme(theme: ThemeEnum | undefined): void {
		if (GenericHelper.nonNull(theme)) {
			this.ui.updateTheme(theme!)
		}
	}

	public notify(message: NotificationModel): void {
		this.notifications.notify(message)
	}

	public confirm(confirmation: ConfirmationModel): void {
		this.notifications.confirm(confirmation)
	}
}
