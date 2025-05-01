import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { GenericService } from '../../util-tool/service/generic.service'
import { SelectItem } from 'primeng/api'
import { MovementTypeEnum } from '../../util-model/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '../../util-model/enumeration/participant-type.enum'
import { ProfileStatusEnum } from '../../util-model/enumeration/profile-status.enum'
import { PresenceStatusEnum } from '../../util-model/enumeration/presence-status.enum'

@Injectable( {
    providedIn: 'root',
} )
export class MetadataService extends GenericService {
    public constructor () {
        super( '/api/metadata' )
    }

    public getMovementsTypes (): Observable<SelectItem<MovementTypeEnum>[]> {
        return this.http.get<SelectItem<MovementTypeEnum>[]>( `${this.baseUrl}/movements/types` )
    }

    public getParticipantsTypes (): Observable<SelectItem<ParticipantTypeEnum>[]> {
        return this.http.get<SelectItem<ParticipantTypeEnum>[]>( `${this.baseUrl}/participants/types` )
    }

    public getProfilesStatus (): Observable<SelectItem<ProfileStatusEnum>[]> {
        return this.http.get<SelectItem<ProfileStatusEnum>[]>( `${this.baseUrl}/profiles/status` )
    }

    public getPresencesStatus (): Observable<SelectItem<PresenceStatusEnum>[]> {
        return this.http.get<SelectItem<PresenceStatusEnum>[]>( `${this.baseUrl}/presences/status` )
    }
}
