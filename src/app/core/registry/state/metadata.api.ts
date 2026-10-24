import {Injectable} from '@angular/core'
import {map, Observable} from 'rxjs'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {SelectOptionModel} from '@shared/models/model/select-option.model'
import {MovementTypeEnum} from '@shared/models/enumeration/movement-type.enum'
import {ParticipantTypeEnum} from '@shared/models/enumeration/participant-type.enum'
import {ProfileStatusEnum} from '@shared/models/enumeration/profile-status.enum'
import {PresenceStatusEnum} from '@shared/models/enumeration/presence-status.enum'
import {AlertStatusEnum} from '@shared/models/enumeration/alert-status.enum'
import { AlertCriticalityMetadataMapper } from '@shared/mappers/alert-criticality-metadata.mapper'
import { AlertCriticalityMetadataResponseDto } from '@shared/models/dto/response/alert-criticality-metadata.response.dto'
import { AlertCriticalityMetadataModel } from '@shared/models/model/alert-criticality-metadata.model'

/**
 * Purpose: Envoie les requêtes HTTP du domaine des métadonnées.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
    providedIn: 'root',
})
export class MetadataApi extends GenericApi {
    public constructor() {
        super('/api/v2/metadata')
    }

    public getPresencesStatus(): Observable<SelectOptionModel<PresenceStatusEnum>[]> {
        return this.http.get<SelectOptionModel<PresenceStatusEnum>[]>(`${this.baseUrl}/presences/status`)
    }

    public getProfilesStatus(): Observable<SelectOptionModel<ProfileStatusEnum>[]> {
        return this.http.get<SelectOptionModel<ProfileStatusEnum>[]>(`${this.baseUrl}/profiles/status`)
    }

    public getMovementsTypes(): Observable<SelectOptionModel<MovementTypeEnum>[]> {
        return this.http.get<SelectOptionModel<MovementTypeEnum>[]>(`${this.baseUrl}/movements/types`)
    }

    public getParticipantsTypes(): Observable<SelectOptionModel<ParticipantTypeEnum>[]> {
        return this.http.get<SelectOptionModel<ParticipantTypeEnum>[]>(`${this.baseUrl}/participants/types`)
    }

    public getAlertCriticality(): Observable<AlertCriticalityMetadataModel> {
        return this.http.get<AlertCriticalityMetadataResponseDto>(`${this.baseUrl}/alerts/criticality`).pipe(
            map( AlertCriticalityMetadataMapper.toModel ),
        )
    }

    public getAlertsStatus(): Observable<SelectOptionModel<AlertStatusEnum>[]> {
        return this.http.get<SelectOptionModel<AlertStatusEnum>[]>(`${this.baseUrl}/alerts/status`)
    }
}
