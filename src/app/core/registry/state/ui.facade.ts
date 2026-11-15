import { computed, inject, Injectable, Signal } from '@angular/core';

import { BrowserService } from '@core/browser/browser.service';
import { NotificationStore } from '@core/registry/state/notification.store';
import { UiStore } from '@core/registry/state/ui.store';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { StateHelper } from '@shared/helpers/state/state.helper';
import { AccountActionEnum } from '@shared/models/enumeration/account-action.enum';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';
import { ErrorModel } from '@shared/models/model/error.model';
import { NotificationModel } from '@shared/models/model/notification.model';

/**
 * Objectif: Point d'entrée public de ce que la coque affiche : thème, taille d'écran, erreur globale, changement de langue en cours, toasts, options d'affichage.
 * Périmètre: Expose les stores de l'UI, des notifications et des métadonnées sous forme de signals et relaie leurs commandes.
 * Limites: Ne sait rien de l'utilisateur ni de la session ; n'appelle pas le backend.
 */
@Injectable({ providedIn: 'root' })
export class UiFacade {
	private readonly browser = inject(BrowserService);
	private readonly ui: InstanceType<typeof UiStore> = inject(UiStore);
	private readonly notifications: InstanceType<typeof NotificationStore> = inject(NotificationStore);

	private readonly onlineMessage = StateHelper.buildNotificationMessage(
		SeverityEnum.SUCCESS,
		'global.notifications.ONLINE.title',
		'global.notifications.ONLINE.message',
	);
	private readonly offlineMessage = StateHelper.buildNotificationMessage(
		SeverityEnum.WARNING,
		'global.notifications.OFFLINE.title',
		'global.notifications.OFFLINE.message',
	);

	public readonly theme = this.ui.theme;
	public readonly refreshMode = this.ui.refreshMode;
	public readonly tinyScreen = computed(() => this.ui.screenWidth() < 768);
	public readonly pendingLanguage = this.ui.pendingLanguage;
	public readonly pendingAccountAction = this.ui.pendingAccountAction;
	public readonly globalError: Signal<NotificationModel | undefined> = this.ui.error;
	private readonly online = this.ui.online;

	public readonly notification = this.notifications.messages$();
	public readonly confirmation = this.notifications.confirmations$();

	public startLanguageChange(language: string): void {
		this.ui.startLanguageChange(language);
	}

	public stopLanguageChange(): void {
		this.ui.stopLanguageChange();
	}

	public startAccountAction(action: AccountActionEnum): void {
		this.ui.startAccountAction(action);
	}

	public stopAccountAction(): void {
		this.ui.stopAccountAction();
	}

	public setGlobalError(error: ErrorModel): void {
		this.ui.setGlobalError(error);
	}

	public reloadApplication(): void {
		this.browser.reload();
	}

	public updateNetwork(online: boolean): void {
		if (this.online() != undefined) {
			this.notify(online ? this.onlineMessage : this.offlineMessage);
		}
		this.ui.updateNetwork(online);
	}

	public updateTheme(theme: ThemeEnum | undefined): void {
		if (GenericHelper.nonNull(theme)) {
			this.ui.updateTheme(theme);
		}
	}

	public updateRefreshMode(refreshMode: RefreshModeEnum): void {
		this.ui.updateRefreshMode(refreshMode);
	}

	public notify(message: NotificationModel): void {
		this.notifications.notify(message);
	}

	public confirm(confirmation: ConfirmationModel): void {
		this.notifications.confirm(confirmation);
	}
}
