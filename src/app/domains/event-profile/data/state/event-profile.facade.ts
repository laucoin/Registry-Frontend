import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ofActionSuccessful } from '@ngxs/store'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { EventProfileState } from './event-profile.state'
import {
    BlockEventProfile,
    CreateEventProfiles,
    DeleteEventProfile,
    FetchAssignableEventProfileRoles,
    FetchEventProfile,
    FetchEventProfilesPage,
    FetchProfileStatus,
    InputEventProfilesPageDateTimeSearched,
    InputEventProfilesPageTextSearched,
    ResetEventProfile,
    SearchUsers,
    SelectEventProfilesPageAvailabilitySearched,
    SelectEventProfilesPageStatusSearched,
    StartEventProfileLoader,
    StartEventProfilesPageLoader,
    StopEventProfileLoader,
    StopEventProfilesPageLoader,
    UnblockEventProfile,
    UpdateEventProfile,
} from './event-profile.action'
import { EventProfileDto } from '../dto/event-profile.dto'
import { EventProfilesDto } from '../dto/event-profiles.dto'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Injectable()
export class EventProfileFacade extends GenericEventElementFacade {
    public get eventProfilesPage (): Signal<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPage )
    }

    public get eventProfilesPageLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageLoading )
    }

    public get eventProfilesPageSilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageSilentLoading )
    }

    public get eventProfilesPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageError )
    }

    public get eventProfilesPageTextSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageTextSearchedParam )
    }

    public get eventProfilesPageDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( EventProfileState.eventProfilesPageDateTimeSearchedParam )() ),
        )
    }

    public get eventProfilesPageAvailabilitySearchedParam (): Signal<boolean | undefined> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageAvailabilitySearchedParam )
    }

    public get eventProfilesPageStatusSearchedParam (): Signal<string | undefined> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageStatusSearchedParam )
    }

    public get eventProfile (): Signal<EventProfileModel | undefined> {
        return this.ngStore.selectSignal( EventProfileState.eventProfile )
    }

    public get eventProfile$ (): Observable<EventProfileModel | undefined> {
        return this.ngStore.select( EventProfileState.eventProfile )
    }

    public get eventProfileLoading (): Signal<boolean> {
        return computed( (): boolean =>
            this.ngStore.selectSignal( EventProfileState.eventProfileLoading )() || this.registryFacade.contextEventLoading(),
        )
    }

    public get searchedUsersMetadata (): Signal<SelectItem<UserModel>[]> {
        return this.ngStore.selectSignal( EventProfileState.searchedUsersMetadata )
    }

    public get eventProfileAssignableRolesMetadata (): Signal<SelectItem<string>[]> {
        return this.ngStore.selectSignal( EventProfileState.eventProfileAssignableRolesMetadata )
    }

    public get eventProfilesStatusMetadata (): Signal<SelectItem<string | undefined>[]> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesStatusMetadata )
    }

    public get eventProfilesAvailabilitiesMetadata (): Signal<SelectItem<boolean | undefined>[]> {
        return computed( (): SelectItem<boolean | undefined>[] =>
            this.ngStore.selectSignal( EventProfileState.eventProfilesAvailabilitiesMetadata )().map( (status: SelectItem<boolean | undefined>): SelectItem<boolean | undefined> => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )
    }

    public startEventProfilesPageLoader (): void {
        this.ngStore.dispatch( StartEventProfilesPageLoader )
    }

    public stopEventProfilesPageLoader (): void {
        this.ngStore.dispatch( StopEventProfilesPageLoader )
    }

    public fetchEventProfilesPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchEventProfilesPage( eventId, pageNumber, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        statusSearched: string | undefined,
        availabilitySearched: boolean | undefined,
    ): void {
        if (textSearched !== this.eventProfilesPageTextSearchedParam()) {
            this.ngStore.dispatch( new InputEventProfilesPageTextSearched( textSearched ) )
        }

        if (dateTimeSearched !== this.eventProfilesPageDateTimeSearchedParam()) {
            this.ngStore.dispatch( new InputEventProfilesPageDateTimeSearched( dateTimeSearched ) )
        }

        if (statusSearched !== this.eventProfilesPageStatusSearchedParam()) {
            this.ngStore.dispatch( new SelectEventProfilesPageStatusSearched( statusSearched ) )
        }

        if (availabilitySearched !== this.eventProfilesPageAvailabilitySearchedParam()) {
            this.ngStore.dispatch( new SelectEventProfilesPageAvailabilitySearched( availabilitySearched ) )
        }
    }

    public startEventProfileLoader (): void {
        this.ngStore.dispatch( StartEventProfileLoader )
    }

    public stopEventProfileLoader (): void {
        this.ngStore.dispatch( StopEventProfileLoader )
    }

    public fetchEventProfile (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchEventProfile( eventId, id ) )
    }

    public resetEventProfile (): void {
        this.ngStore.dispatch( ResetEventProfile )
    }

    public searchUsers (
        textSearched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchUsers( eventId, textSearched ) )
    }

    public fetchAssignableRoles (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchAssignableEventProfileRoles( eventId ) )
    }

    public fetchProfileStatus (): void {
        if (this.eventProfilesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchProfileStatus )
        }
    }

    public createEventProfiles (
        eventProfiles: EventProfilesDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateEventProfiles> {
        this.ngStore.dispatch( new CreateEventProfiles( eventId, eventProfiles ) )
        return this.actions$.pipe( ofActionSuccessful( CreateEventProfiles ) )
    }

    public updateEventProfile (
        id: string,
        eventProfile: EventProfileDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateEventProfile> {
        this.ngStore.dispatch( new UpdateEventProfile( eventId, id, eventProfile ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateEventProfile ) )
    }

    public blockEventProfile (
        profile: EventProfileModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new BlockEventProfile( eventId, profile ) )
    }

    public unblockEventProfile (
        profile: EventProfileModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new UnblockEventProfile( eventId, profile ) )
    }

    public deleteEventProfile (
        eventProfile: EventProfileModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new DeleteEventProfile( eventId, eventProfile ) )
    }
}
