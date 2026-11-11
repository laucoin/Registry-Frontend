import { Component, inject } from '@angular/core';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ElementMovementsListComponent } from '@pages/projects/[projectId]/movements/element-movements/element-movements-list.component';
import { injectElementMovements } from '@pages/projects/[projectId]/movements/element-movements/inject-element-movements';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PresenceTimelineComponent } from '@shared/ui/common/presence-timeline/presence-timeline.component';

/**
 * Objectif: Page listant les mouvements d'un participant avec ses frises de présence.
 * Périmètre: Relie les mouvements du participant, sa recherche et ses frises prévue et réelle à la facade des
 * participants.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-participant-movements-list',
	imports: [ElementMovementsListComponent, PresenceTimelineComponent],
	templateUrl: './participant-movements-list.page.html',
})
export class ParticipantMovementsListPage {
	protected readonly facade = inject(ParticipantFacade);
	protected readonly session = inject(SessionFacade);

	protected readonly movements = injectElementMovements<ParticipantModel>({
		idParam: 'participantId',
		page: this.facade.participantMovementsPage,
		pageError: this.facade.participantMovementsPageError,
		pageLoading: this.facade.participantMovementsPageLoading,
		pageSilentLoading: this.facade.participantMovementsPageSilentLoading,
		appliedFilters: () => [
			this.facade.participantMovementsPageTypeParam(),
			this.facade.participantMovementsPageFromParam(),
			this.facade.participantMovementsPageToParam(),
			this.facade.participantMovementsPageIsVisibleParam(),
		],
		fetchElement: (id) => this.facade.fetchParticipant(id),
		fetchDetails: (id) => this.facade.fetchParticipantTimeline(id),
		reloadDetails: (id) => this.facade.reloadParticipantTimeline(id),
		fetchPage: (id, page, size) => this.facade.fetchParticipantMovementsPage(id, page, size),
		reloadPage: (id) => this.facade.reloadParticipantMovementsPage(id),
		inputSearch: (search) =>
			this.facade.inputMovementsPageSearchParameters(
				search.type,
				search.from,
				search.to,
				search.isVisible,
				search.sort,
			),
		titleOf: (participant) =>
			[participant.firstName, participant.lastName?.toUpperCase()].filter(Boolean).join(' '),
	});
}
