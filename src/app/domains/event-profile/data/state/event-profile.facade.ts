import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { EventProfileState } from './event-profile.state'
import {
    BlockEventProfile,
    CreateEventProfiles,
    CreateSupportEventProfile,
    DeleteEventProfile,
    FetchAssignableEventProfileRoles,
    FetchAssignableEventProfileStatus,
    FetchEventProfile,
    FetchEventProfilesPage,
    InputEventProfilesPageDateRange,
    InputEventProfilesPageSearch,
    SearchUsers,
    SelectEventProfilesPageOrder,
    SelectEventProfilesPageStatus,
    SelectEventProfilesPageVisibility,
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

@Injectable()
export class EventProfileFacade extends GenericEventElementFacade {
    public get eventProfilesPage (): Observable<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.select( EventProfileState.eventProfilesPage )
    }

    public get eventProfilesPageLoading (): Observable<boolean> {
        return this.ngStore.select( EventProfileState.eventProfilesPageLoading )
    }

    public get eventProfilesPageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( EventProfileState.eventProfilesPageSilentLoading )
    }

    public get eventProfilesPageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( EventProfileState.eventProfilesPageError )
    }

    public get actualEventProfilesPageSearchParam (): string | undefined {
        return this.ngStore.selectSnapshot( EventProfileState.eventProfilesPageSearchParam )
    }

    public get actualEventProfilesPageDateRangeParam (): Date[] | undefined {
        return FormUtil.buildDateRange(
            this.ngStore.selectSnapshot( EventProfileState.eventProfilesPageStartAccessParam ),
            this.ngStore.selectSnapshot( EventProfileState.eventProfilesPageEndAccessParam ),
        )
    }

    public get actualEventProfilesPageStatusParam (): string | undefined {
        return this.ngStore.selectSnapshot( EventProfileState.eventProfilesPageStatusParam )
    }

    public get actualEventProfilesPageOnlyVisibleParam (): boolean {
        return this.ngStore.selectSnapshot( EventProfileState.eventProfilesPageOnlyVisibleParam )
    }

    public get actualEventProfilesPageOrderParam (): OrderEnum {
        return this.ngStore.selectSnapshot( EventProfileState.eventProfilesPageOrderParam )
    }

    public get eventProfile (): Observable<EventProfileModel | undefined> {
        return this.ngStore.select( EventProfileState.eventProfile )
    }

    public get eventProfileLoading (): Observable<boolean> {
        return this.ngStore.select( EventProfileState.eventProfileLoading )
    }

    public get searchedUsersMetadata (): Observable<SelectItem<UserModel>[]> {
        return this.ngStore.select( EventProfileState.searchedUsersMetadata )
    }

    public get eventProfileAssignableRolesMetadata (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( EventProfileState.eventProfileAssignableRolesMetadata )
    }

    public get eventProfilesStatusMetadata (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( EventProfileState.eventProfilesStatusMetadata )
    }

    public startEventProfilesPageLoader (): void {
        this.ngStore.dispatch( StartEventProfilesPageLoader )
    }

    public stopEventProfilesPageLoader (): void {
        this.ngStore.dispatch( StopEventProfilesPageLoader )
    }

    public fetchEventProfilesPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchEventProfilesPage( eventId, offset, limit, force ) )
    }

    public inputEventProfilesPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputEventProfilesPageSearch( searched ) )
    }

    public inputEventProfilesPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputEventProfilesPageDateRange( range?.[0], range?.[1] ) )
    }

    public selectEventProfilesPageStatus (status: string | undefined): void {
        this.ngStore.dispatch( new SelectEventProfilesPageStatus( status ) )
    }

    public selectEventProfilesPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectEventProfilesPageVisibility( onlyVisible ) )
    }

    public selectEventProfilesPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectEventProfilesPageOrder( order ) )
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

    public searchUsers (
        searched: string | undefined = undefined,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new SearchUsers( eventId, searched ) )
    }

    public fetchAssignableRoles (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchAssignableEventProfileRoles( eventId ) )
    }

    public fetchAvailableStatus (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new FetchAssignableEventProfileStatus( eventId ) )
    }

    public createEventProfiles (
        eventProfiles: EventProfilesDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateEventProfiles> {
        this.ngStore.dispatch( new CreateEventProfiles( eventId, eventProfiles ) )
        return this.actions$.pipe( ofActionSuccessful( CreateEventProfiles ) )
    }

    public createSupportEventProfile (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new CreateSupportEventProfile( eventId ) )
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
