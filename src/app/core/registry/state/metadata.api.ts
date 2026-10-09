import {Injectable} from '@angular/core'
import {Observable} from 'rxjs'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {SelectOptionModel} from '@shared/models/model/select-option.model'
import {MovementTypeEnum} from '@shared/models/enumeration/movement-type.enum'
import {ParticipantTypeEnum} from '@shared/models/enumeration/participant-type.enum'
import {ProfileStatusEnum} from '@shared/models/enumeration/profile-status.enum'
import {PresenceStatusEnum} from '@shared/models/enumeration/presence-status.enum'
import {AlertStatusEnum} from '@shared/models/enumeration/alert-status.enum'

/**
 * Purpose: Sends the HTTP requests of the metadata domain.
 * Scope: Builds the urls and the query parameters and returns the backend responses.
 * Limits: Holds no state and handles no error; stores and facades do.
 */
@Injectable({
    providedIn: 'root',
})
export class MetadataApi extends GenericApi {
    public constructor() {
        super('/api/v1/metadata')
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

    public getAlertsStatus(): Observable<SelectOptionModel<AlertStatusEnum>[]> {
        return this.http.get<SelectOptionModel<AlertStatusEnum>[]>(`${this.baseUrl}/alerts/status`)
    }
}
