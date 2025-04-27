import { computed, Injectable, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ActionCompletion, ofActionCompleted, ofActionSuccessful } from '@ngxs/store'
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
    ResetEventProfile,
    SearchUsers,
    StartEventProfileLoader,
    StartEventProfilesPageLoader,
    StopEventProfileLoader,
    StopEventProfilesPageLoader,
    UnblockEventProfile,
    UpdateEventProfile,
    UpdateEventProfilesPageSearchParams,
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

    private get eventProfilesPageResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( EventProfileState.eventProfilesPageResetSearch )
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
        return this.ngStore.selectSignal( EventProfileState.eventProfileLoading )
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
    ): void {
        const index: number | undefined = this.eventProfilesPageResetSearch() ? 0 : pageNumber
        this.ngStore.dispatch( new FetchEventProfilesPage( this.selectedEventId(), index, pageSize, force ) )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        dateTimeSearched: Date | undefined,
        statusSearched: string | undefined,
        availabilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.eventProfilesPageTextSearchedParam() != textSearched
                                     || this.eventProfilesPageDateTimeSearchedParam() != dateTimeSearched?.toISOString()
                                     || this.eventProfilesPageStatusSearchedParam() != statusSearched
                                     || this.eventProfilesPageAvailabilitySearchedParam() != availabilitySearched

        if (resetSearch) {
            this.ngStore.dispatch( new UpdateEventProfilesPageSearchParams( {
                resetSearch: resetSearch,
                statusSearched: statusSearched,
                availabilitySearched: availabilitySearched,
                textSearched: textSearched,
                dateTimeSearched: dateTimeSearched?.toISOString(),
            } ) )
        }
    }

    public startEventProfileLoader (): void {
        this.ngStore.dispatch( StartEventProfileLoader )
    }

    public stopEventProfileLoader (): void {
        this.ngStore.dispatch( StopEventProfileLoader )
    }

    public fetchEventProfile (id: string): void {
        this.ngStore.dispatch( new FetchEventProfile( this.selectedEventId(), id ) )
    }

    public resetEventProfile (): void {
        this.ngStore.dispatch( ResetEventProfile )
    }

    public searchUsers (textSearched: string | undefined = undefined): void {
        this.ngStore.dispatch( new SearchUsers( this.selectedEventId(), textSearched ) )
    }

    public fetchAssignableRoles (): void {
        this.ngStore.dispatch( new FetchAssignableEventProfileRoles( this.selectedEventId() ) )
    }

    public fetchProfileStatus (): void {
        if (this.eventProfilesStatusMetadata().length === 0) {
            this.ngStore.dispatch( FetchProfileStatus )
        }
    }

    public createEventProfiles (
        eventProfiles: EventProfilesDto,
    ): Observable<CreateEventProfiles> {
        this.ngStore.dispatch( new CreateEventProfiles( this.selectedEventId(), eventProfiles ) )
        return this.actions$.pipe( ofActionSuccessful( CreateEventProfiles ) )
    }

    public updateEventProfile (
        id: string,
        eventProfile: EventProfileDto,
    ): Observable<UpdateEventProfile> {
        this.ngStore.dispatch( new UpdateEventProfile( this.selectedEventId(), id, eventProfile ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateEventProfile ) )
    }

    public blockEventProfile (
        profile: EventProfileModel,
    ): Observable<ActionCompletion<BlockEventProfile>> {
        this.ngStore.dispatch( new BlockEventProfile( this.selectedEventId(), profile ) )

        return this.actions$.pipe( ofActionCompleted( BlockEventProfile ) )
    }

    public unblockEventProfile (
        profile: EventProfileModel,
    ): Observable<ActionCompletion<UnblockEventProfile>> {
        this.ngStore.dispatch( new UnblockEventProfile( this.selectedEventId(), profile ) )

        return this.actions$.pipe( ofActionCompleted( UnblockEventProfile ) )
    }

    public deleteEventProfile (
        eventProfile: EventProfileModel,
    ): Observable<ActionCompletion<DeleteEventProfile>> {
        this.ngStore.dispatch( new DeleteEventProfile( this.selectedEventId(), eventProfile ) )

        return this.actions$.pipe( ofActionCompleted( DeleteEventProfile ) )
    }
}
