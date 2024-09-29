import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericService } from '../../../../shared/util-tool/service/generic.service'
import { EventDto } from '../dto/event.dto'
import { EventPageParamsModel } from '../model/event-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'

@Injectable( {
    providedIn: 'root',
} )
export class EventService extends GenericService {
    public constructor () {
        super( '/api/events' )
    }

    public findEvents (
        offset: number | undefined,
        limit: number | undefined,
        params: EventPageParamsModel,
    ): Observable<PageModel<EventModel>> {
        return this.http.get<PageModel<EventModel>>(
            `${this.baseUrl}?${QueryUtil.buildQueryParams( offset, limit, params ).toString()}`,
        )
    }

    public findEventById (id: string): Observable<EventModel> {
        return this.http.get<EventModel>( `${this.baseUrl}/${id}` )
    }

    public createEvent (event: EventDto): Observable<EventModel> {
        return this.http.post<EventModel>( this.baseUrl, event )
    }

    public updateEventById (id: string, event: EventDto): Observable<EventModel> {
        return this.http.patch<EventModel>( `${this.baseUrl}/${id}`, event )
    }

    public disableEventById (id: string): Observable<EventModel> {
        return this.http.patch<EventModel>( `${this.baseUrl}/${id}/disable`, null )
    }

    public enableEventById (id: string): Observable<EventModel> {
        return this.http.patch<EventModel>( `${this.baseUrl}/${id}/enable`, null )
    }

    public deleteEventById (id: string): Observable<void> {
        return this.http.delete<void>( `${this.baseUrl}/${id}` )
    }
}
