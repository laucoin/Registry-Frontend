import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventService } from '../../../../shared/util-tool/service/generic-event.service'
import { SELECT_PROFILE_EVENT_ID } from '../../../../shared/util-tool/util/request.util'
import { EventProfileDto } from '../dto/event-profile.dto'
import { EventProfilesDto } from '../dto/event-profiles.dto'
import { EventProfilePageParamsModel } from '../model/event-profile-page-params.model'
import { QueryUtil } from '../../../../shared/util-tool/util/query.util'
import { CreatedEventProfiles } from '../dto/created-event-profiles.dto'
import { HttpParams } from '@angular/common/http'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { SelectItem } from 'primeng/api'

@Injectable( {
    providedIn: 'root',
} )
export class EventProfileService extends GenericEventService {
    public constructor () {
        super( `/api/events/${SELECT_PROFILE_EVENT_ID}/profiles` )
    }

    public findEventProfiles (
        eventId: string | undefined,
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: EventProfilePageParamsModel,
    ): Observable<PageModel<EventProfileModel>> {
        return this.http.get<PageModel<EventProfileModel>>(
            `${this.buildRequestBaseUrl( eventId )}?${QueryUtil.buildQueryParams(
                pageNumber,
                pageSize,
                params,
            ).toString()}`,
        )
    }

    public searchUsers (
        eventId: string | undefined,
        textSearched: string | undefined,
    ): Observable<UserModel[]> {
        return this.http.get<UserModel[]>(
            `${this.buildRequestBaseUrl( eventId )}/search/users${textSearched ? '?' + new HttpParams().set(
                'textSearched',
                textSearched,
            ).toString() : ''}`,
        )
    }

    public getAssignableEventProfileRoles (eventId: string | undefined): Observable<SelectItem<string>[]> {
        return this.http.get<SelectItem<string>[]>( `${this.buildRequestBaseUrl( eventId )}/roles` )
    }

    public findEventProfileById (eventId: string | undefined, id: string): Observable<EventProfileModel> {
        return this.http.get<EventProfileModel>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }

    public createEventProfiles (
        eventId: string | undefined,
        profiles: EventProfilesDto,
    ): Observable<CreatedEventProfiles> {
        return this.http.post<CreatedEventProfiles>( `${this.buildRequestBaseUrl( eventId )}`, profiles )
    }

    public updateEventProfileById (
        eventId: string | undefined,
        id: string,
        profile: EventProfileDto,
    ): Observable<EventProfileModel> {
        return this.http.patch<EventProfileModel>( `${this.buildRequestBaseUrl( eventId )}/${id}`, profile )
    }

    public blockEventProfileById (eventId: string | undefined, id: string): Observable<EventProfileModel> {
        return this.http.patch<EventProfileModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/block`, null )
    }

    public unblockEventProfileById (eventId: string | undefined, id: string): Observable<EventProfileModel> {
        return this.http.patch<EventProfileModel>( `${this.buildRequestBaseUrl( eventId )}/${id}/unblock`, null )
    }

    public deleteEventProfileById (eventId: string | undefined, id: string): Observable<void> {
        return this.http.delete<void>( `${this.buildRequestBaseUrl( eventId )}/${id}` )
    }
}
