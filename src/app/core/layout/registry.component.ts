import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, Signal, viewChild } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { GlobalErrorComponent } from '@core/layout/global-error/global-error.component'
import { UiFacade } from '@core/registry/state/ui.facade'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { NotificationModel } from '@shared/models/model/notification.model'

interface ToastHost {
	create(message: string, options: { variant: string, title: string, duration?: number }): unknown
}

const DEFAULT_VARIANT: string = 'primary'
const STICKY_DURATION: number = 0
const VARIANTS: Record<string, string> = {
	[SeverityEnum.SUCCESS]: 'success',
	[SeverityEnum.INFO]: 'info',
	[SeverityEnum.WARNING]: 'warning',
	[SeverityEnum.ERROR]: 'danger',
	[SeverityEnum.DANGER]: 'danger',
}

/**
 * Purpose: Root component of the application: hosts the routed pages, shows the notifications as toasts and swaps the pages for the global error when the whole application is blocked.
 * Scope: Translates each notification of the UI facade into a sgdf-toast and chooses between the routed pages and the global error.
 * Limits: Does not decide what is notified or what blocks the application, does not render the error itself and does not show the confirmations.
 */
@Component({
	selector: 'app-root',
	templateUrl: './registry.component.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [
		RouterOutlet,
		GlobalErrorComponent,
	]
})
export class RegistryComponent {
	private readonly uiFacade: UiFacade = inject(UiFacade)
	private readonly translateService: TranslocoService = inject(TranslocoService)
	protected readonly globalError: Signal<NotificationModel | undefined> = this.uiFacade.globalError
	private readonly toast: Signal<ElementRef<ToastHost>> = viewChild.required<ElementRef<ToastHost>>('toast')

	public constructor() {
		this.uiFacade.notification.pipe(takeUntilDestroyed()).subscribe((it: NotificationModel): void => this.show(it))
	}

	private show(notification: NotificationModel): void {
		this.toast().nativeElement.create(this.translate(notification.detail, notification.data), {
			variant: VARIANTS[notification.severity ?? ''] ?? DEFAULT_VARIANT,
			title: this.translate(notification.summary, notification.data),
			duration: this.duration(notification),
		})
	}

	private translate(key: string | undefined, data: object | undefined): string {
		return key ? this.translateService.translate(key, data as Record<string, unknown>) : ''
	}

	private duration(notification: NotificationModel): number | undefined {
		return notification.sticky ? STICKY_DURATION : notification.life
	}
}
