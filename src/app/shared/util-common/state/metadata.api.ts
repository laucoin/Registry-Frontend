import { Injectable } from '@angular/core'
import { SelectItem } from 'primeng/api'
import { Observable } from 'rxjs'
import { AlertStatusEnum } from '../../util-model/enumeration/alert-status.enum'
import { MovementTypeEnum } from '../../util-model/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '../../util-model/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '../../util-model/enumeration/presence-status.enum'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { GenericApi } from '../../util-tool/service/generic.api'

@Injectable({
	providedIn: 'root',
})
export class MetadataApi extends GenericApi {
	public constructor() {
		super('/api/v1/metadata')
	}

	public getPresencesStatus(): Observable<SelectItem<PresenceStatusEnum>[]> {
		return this.http.get<SelectItem<PresenceStatusEnum>[]>(`${this.baseUrl}/presences/status`)
	}

	public getProfilesStatus(): Observable<SelectItem<ProfileStatusEnum>[]> {
		return this.http.get<SelectItem<ProfileStatusEnum>[]>(`${this.baseUrl}/profiles/status`)
	}

	public getMovementsTypes(): Observable<SelectItem<MovementTypeEnum>[]> {
		return this.http.get<SelectItem<MovementTypeEnum>[]>(`${this.baseUrl}/movements/types`)
	}

	public getParticipantsTypes(): Observable<SelectItem<ParticipantTypeEnum>[]> {
		return this.http.get<SelectItem<ParticipantTypeEnum>[]>(`${this.baseUrl}/participants/types`)
	}

	public getAlertsStatus(): Observable<SelectItem<AlertStatusEnum>[]> {
		return this.http.get<SelectItem<AlertStatusEnum>[]>(`${this.baseUrl}/alerts/status`)
	}
}
