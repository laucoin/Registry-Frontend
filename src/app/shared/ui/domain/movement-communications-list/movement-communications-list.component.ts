import { Component, computed, DestroyRef, inject, input, InputSignal, OnInit, Signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import {
    CommunicationFacade
} from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ConversationScrollDirective } from '@shared/directives/conversation-scroll.directive'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component'
import { Observable, tap } from 'rxjs'

/**
 * Purpose: List of the communications of a movement.
 * Scope: Loads and displays the communications of one movement with search and actions.
 * Limits: Reads through the movement, communication and alert facades only.
 */
@Component({
	selector: 'app-movement-communications-list',
	imports: [
		ConversationScrollDirective,
		DialogElementComponent,
	],
	templateUrl: './movement-communications-list.component.html',
	styleUrl: './movement-communications-list.component.css',
})
export class MovementCommunicationsListComponent extends GenericComponent implements OnInit {
	private readonly destroyRef: DestroyRef = inject(DestroyRef)
	protected readonly facade: MovementFacade = inject(MovementFacade)
	protected readonly communicationFacade: CommunicationFacade = inject(CommunicationFacade)
	protected readonly alertFacade: AlertFacade = inject(AlertFacade)

	public readonly movement: InputSignal<MovementModel> = input.required()

	protected readonly communications: Signal<CommunicationModel[]> = computed(
		(): CommunicationModel[] => CommunicationHelper.chronological(this.facade.movementCommunicationsPage()?.content),
	)

	public ngOnInit(): void {
		this.loadData()
		this.handleCommunicationActions()
	}

	protected loadData(): void {
		this.facade.fetchMovementCommunicationsPage(this.movement().id!, undefined, undefined)
	}

	private handleCommunicationActions(): void {
		this.reloadOn(this.communicationFacade.handleCommunicationFirstPageReload())
		this.reloadOn(this.alertFacade.handleAlertCreation())
		this.reloadOn(this.communicationFacade.handleCommunicationCurrentPageReload())
	}

	private reloadOn(events: Observable<unknown>): void {
		events.pipe(
			tap((): void => this.facade.reloadMovementCommunications(this.movement().id!)),
		).pipe(takeUntilDestroyed(this.destroyRef)).subscribe()
	}

	protected loadOlder(): void {
		if (!this.facade.movementCommunicationsPageLoading() && !this.facade.movementCommunicationsPageSilentLoading()) {
			this.facade.loadOlderMovementCommunications(this.movement().id!)
		}
	}

	protected getPreviousAuthorId(index: number): string | undefined {
		return CommunicationHelper.previousAuthorId(this.communications(), index)
	}

	protected getNextAuthorId(index: number): string | undefined {
		return CommunicationHelper.nextAuthorId(this.communications(), index)
	}
}
