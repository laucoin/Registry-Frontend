import { Component, computed, DestroyRef, inject, input, InputSignal, OnInit, Signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import {
    CommunicationFacade
} from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { ConversationScrollDirective } from '@shared/directives/conversation-scroll.directive'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { AlertModel } from '@shared/models/model/alert.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component'
import { Observable, tap } from 'rxjs'

/**
 * Purpose: List of the communications of an alert.
 * Scope: Loads the communications of one alert and reloads them when a communication changes.
 * Limits: Reads through the alert and communication facades only.
 */
@Component({
	selector: 'app-alert-communications-list',
	imports: [
		ConversationScrollDirective,
		DialogElementComponent,
	],
	templateUrl: './alert-communications-list.component.html',
	styleUrl: './alert-communications-list.component.css',
})
export class AlertCommunicationsListComponent implements OnInit {
	private readonly destroyRef: DestroyRef = inject(DestroyRef)
	protected readonly facade: AlertFacade = inject(AlertFacade)
	protected readonly communicationFacade: CommunicationFacade = inject(CommunicationFacade)

	public readonly alert: InputSignal<AlertModel> = input.required()

	protected readonly communications: Signal<CommunicationModel[]> = computed(
		(): CommunicationModel[] => CommunicationHelper.chronological(this.facade.alertCommunicationsPage()?.content),
	)

	public ngOnInit(): void {
		this.loadData()
		this.handleCommunicationActions()
	}

	protected loadData(): void {
		this.facade.fetchAlertCommunicationsPage(this.alert().id!, undefined, undefined)
	}

	protected loadOlder(): void {
		if (!this.facade.alertCommunicationsPageLoading() && !this.facade.alertCommunicationsPageSilentLoading()) {
			this.facade.loadOlderAlertCommunications(this.alert().id!)
		}
	}

	protected getPreviousAuthorId(index: number): string | undefined {
		return CommunicationHelper.previousAuthorId(this.communications(), index)
	}

	protected getNextAuthorId(index: number): string | undefined {
		return CommunicationHelper.nextAuthorId(this.communications(), index)
	}

	private handleCommunicationActions(): void {
		this.reloadOn(this.communicationFacade.handleCommunicationFirstPageReload())
		this.reloadOn(this.communicationFacade.handleCommunicationCurrentPageReload())
	}

	private reloadOn(events: Observable<unknown>): void {
		events.pipe(
			tap((): void => this.facade.reloadAlertCommunications(this.alert().id!)),
		).pipe(takeUntilDestroyed(this.destroyRef)).subscribe()
	}
}
