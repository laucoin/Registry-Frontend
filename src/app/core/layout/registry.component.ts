import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, Signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';

import { ConfirmationDialogComponent } from '@core/layout/confirmation-dialog/confirmation-dialog.component';
import { GlobalErrorComponent } from '@core/layout/global-error/global-error.component';
import { UiFacade } from '@core/registry/state/ui.facade';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { NotificationModel } from '@shared/models/model/notification.model';

import '@sgdf/ui/toast';

interface ToastHost {
	create(message: string, options: { variant: string; title: string; duration?: number }): unknown;
}

const DEFAULT_VARIANT = 'primary';
const STICKY_DURATION = 0;
const VARIANTS: Record<string, string> = {
	[SeverityEnum.SUCCESS]: 'success',
	[SeverityEnum.INFO]: 'info',
	[SeverityEnum.WARNING]: 'warning',
	[SeverityEnum.ERROR]: 'danger',
	[SeverityEnum.DANGER]: 'danger',
};

/**
 * Purpose: Composant racine de l'application : héberge les pages routées, affiche les notifications sous forme de toasts, héberge le dialogue de confirmation et remplace les pages par l'erreur globale quand toute l'application est bloquée.
 * Scope: Traduit chaque notification de la facade UI en sgdf-toast et choisit entre les pages routées et l'erreur globale.
 * Limits: Ne décide pas de ce qui est notifié ni de ce qui bloque l'application, et n'affiche ni l'erreur ni les confirmations lui-même.
 */
@Component({
	selector: 'app-root',
	templateUrl: './registry.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [RouterOutlet, GlobalErrorComponent, ConfirmationDialogComponent],
})
export class RegistryComponent {
	private readonly uiFacade = inject(UiFacade);
	private readonly translateService = inject(TranslocoService);
	protected readonly globalError: Signal<NotificationModel | undefined> = this.uiFacade.globalError;
	private readonly toast = viewChild.required<ElementRef<ToastHost>>('toast');

	constructor() {
		this.uiFacade.notification.pipe(takeUntilDestroyed()).subscribe((it) => this.show(it));
	}

	private show(notification: NotificationModel): void {
		this.toast().nativeElement.create(this.translate(notification.detail, notification.data), {
			variant: VARIANTS[notification.severity ?? ''] ?? DEFAULT_VARIANT,
			title: this.translate(notification.summary, notification.data),
			duration: this.duration(notification),
		});
	}

	private translate(key: string | undefined, data: object | undefined): string {
		return key ? this.translateService.translate(key, data as Record<string, unknown>) : '';
	}

	private duration(notification: NotificationModel): number | undefined {
		return notification.sticky ? STICKY_DURATION : notification.life;
	}
}
