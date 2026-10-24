import { computed, inject, Injectable, Signal } from '@angular/core'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { SessionFacade } from '@core/registry/state/session.facade'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import { MovementPrefillModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.model'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model'

const STATE_KEY: string = 'movementPrefill'

/**
 * Purpose: Opens the movement form already filled in from the project home.
 * Scope: Builds the prefill of a planned movement, of a presence to regularize or of the reverse of a movement, navigates to the matching form and hands the prefill over through the navigation state.
 * Limits: Does not validate the prefill nor save anything; the form stays the one to check and submit.
 */
@Injectable( { providedIn: 'root' } )
export class MovementPrefillService {
    private readonly router: Router = inject( Router )
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    private readonly translateService: TranslocoService = inject( TranslocoService )

    public readonly canCreate: Signal<boolean> = computed( (): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.sessionFacade.currentProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
    ) )

    public openPlanned (movement: PlannedMovementModel): void {
        this.open( movement.contentType, {
            type: movement.type.value,
            reason: movement.reason,
            content: movement.participants.map( (participant: ParticipantModel) => ({ poolName: movement.poolName || undefined, participant, vehicle: undefined }) ),
        } )
    }

    public openRegularization (participant: ParticipantModel): void {
        this.open( participant.type?.value ?? ParticipantTypeEnum.REGISTERED, {
            type: MovementTypeEnum.OUT,
            reason: this.definitiveDeparture(),
            content: [ { poolName: undefined, participant, vehicle: undefined } ],
        } )
    }

    public openReverse (movement: MovementModel, contents: MovementContentModel[] = movement.content): void {
        this.open( movement.contentType, {
            type: movement.type.value === MovementTypeEnum.OUT ? MovementTypeEnum.IN : MovementTypeEnum.OUT,
            reason: undefined,
            content: contents.map( (content: MovementContentModel): MovementContentModel => ({ ...content, vehicle: undefined }) ),
        } )
    }

    private definitiveDeparture (): MovementReasonModel {
        return {
            kind: 'REASON',
            type: MovementTypeEnum.OUT,
            value: 'DEFINITIVE_DEPARTURE',
            label: this.translateService.translate( 'movements.form.reason.definitive-departure' ),
        }
    }

    public read (): MovementPrefillModel | undefined {
        const prefill: MovementPrefillModel | undefined = (history.state as Record<string, MovementPrefillModel> | null)?.[STATE_KEY]
        return prefill?.type ? prefill : undefined
    }

    private open (contentType: ParticipantTypeEnum, prefill: MovementPrefillModel): void {
        if (!this.canCreate()) return
        const route: MovementRoutesEnum = contentType === ParticipantTypeEnum.GUEST ? MovementRoutesEnum.CREATE_GUEST : MovementRoutesEnum.CREATE_REGISTERED
        const url: string = `/${ RegistryRouteEnum.PROJECTS_MOVEMENTS.replace( ':projectId', this.sessionFacade.currentProjectId()! ) }/${ route }`
        this.router.navigateByUrl( url, { state: { [STATE_KEY]: prefill } } ).catch( console.error )
    }
}
