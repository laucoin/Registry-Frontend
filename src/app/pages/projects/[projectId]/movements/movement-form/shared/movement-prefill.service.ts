import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';

import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper';
import { BrowserService } from '@core/browser/browser.service';
import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { MovementPrefillModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.model';
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';

const STATE_KEY = 'movementPrefill';

/**
 * Purpose: Ouvre le formulaire de mouvement déjà rempli depuis l'accueil du projet.
 * Scope: Construit le préremplissage d'un mouvement prévu, d'une présence à régulariser ou de l'inverse d'un mouvement, navigue vers le formulaire correspondant et lui transmet le préremplissage via l'état de navigation.
 * Limits: Ne valide pas le préremplissage et n'enregistre rien ; le formulaire reste celui qui vérifie et soumet.
 */
@Injectable({ providedIn: 'root' })
export class MovementPrefillService {
	private readonly router = inject(Router);
	private readonly browser = inject(BrowserService);
	private readonly sessionFacade = inject(SessionFacade);
	private readonly translateService = inject(TranslocoService);

	public readonly canCreate = computed(() =>
		CurrentUserHelper.hasProjectAuthority(
			this.sessionFacade.currentUser(),
			this.sessionFacade.currentProjectId(),
			ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
		),
	);

	public openPlanned(movement: PlannedMovementModel): void {
		this.open(movement.contentType, {
			type: movement.type.value,
			reason: movement.reason,
			content: movement.participants.map((participant) => ({
				poolName: movement.poolName || undefined,
				participant,
				vehicle: undefined,
			})),
		});
	}

	public openRegularization(participant: ParticipantModel): void {
		this.open(participant.type?.value ?? ParticipantTypeEnum.REGISTERED, {
			type: MovementTypeEnum.OUT,
			reason: this.definitiveDeparture(),
			content: [{ poolName: undefined, participant, vehicle: undefined }],
		});
	}

	public openReverse(movement: MovementModel, contents: MovementContentModel[] = movement.content): void {
		this.open(movement.contentType, {
			type: movement.type.value === MovementTypeEnum.OUT ? MovementTypeEnum.IN : MovementTypeEnum.OUT,
			reason: undefined,
			content: contents.map((content): MovementContentModel => ({
				...content,
				vehicle: undefined,
			})),
		});
	}

	private definitiveDeparture(): MovementReasonModel {
		return {
			kind: 'REASON',
			type: MovementTypeEnum.OUT,
			value: 'DEFINITIVE_DEPARTURE',
			label: this.translateService.translate('movements.form.reason.definitive-departure'),
		};
	}

	public read(): MovementPrefillModel | undefined {
		const prefill = (this.browser.historyState as Record<string, MovementPrefillModel> | null)?.[STATE_KEY];
		return prefill?.type ? prefill : undefined;
	}

	private open(contentType: ParticipantTypeEnum, prefill: MovementPrefillModel): void {
		const projectId = this.sessionFacade.currentProjectId();
		if (!this.canCreate() || !projectId) return;
		const route: MovementRoutesEnum =
			contentType === ParticipantTypeEnum.GUEST
				? MovementRoutesEnum.CREATE_GUEST
				: MovementRoutesEnum.CREATE_REGISTERED;
		const url = `/${RegistryRouteEnum.PROJECTS_MOVEMENTS.replace(':projectId', projectId)}/${route}`;
		this.router.navigateByUrl(url, { state: { [STATE_KEY]: prefill } }).catch((): void => undefined);
	}
}
