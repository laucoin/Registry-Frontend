import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { GenericService } from '../../util-tool/service/generic.service'
import { SelectItem } from 'primeng/api'

@Injectable( {
    providedIn: 'root',
} )
export class MetadataService extends GenericService {
    public constructor () {
        super( '/api/metadata' )
    }

    public getMovementsTypes (): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>( `${this.baseUrl}/movements/types` )
    }

    public getProfilesStatus (): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>( `${this.baseUrl}/profiles/status` )
    }

    public getPresencesStatus (): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>( `${this.baseUrl}/presences/status` )
    }
}
