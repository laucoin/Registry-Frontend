import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { PageModel } from '../../../../shared/util-model/model/page.model'
import { StateModel } from '../../../../shared/util-model/model/state.model'
import { GenericEventElementFacade } from '../../../../shared/util-tool/facade/generic-event-element.facade'
import { EventProfileDto } from '../dto/event-profile.dto'
import { EventProfilesDto } from '../dto/event-profiles.dto'
import {
    BlockEventProfile,
    CreateEventProfiles,
    CreateSupportEventProfile,
    DeleteEventProfile,
    FetchAssignableEventProfileRoles,
    FetchEventProfile,
    FetchEventProfilePage,
    InputEventProfilePageDateRange,
    InputEventProfilePageSearch,
    SearchUsers,
    SelectEventProfilePageOrder,
    SelectEventProfilePageStatus,
    SelectEventProfilePageVisibility,
    StartEventProfileLoader,
    StartEventProfilesPageLoader,
    StopEventProfileLoader,
    StopEventProfilesPageLoader,
    UnblockEventProfile,
    UpdateEventProfile,
} from './event-profile.action'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { OrderEnum } from '../../../../shared/util-model/enumeration/order.enum'
import { ProfileStatusEnum } from '../../../../shared/util-model/enumeration/profile-status.enum'
import { ofActionSuccessful } from '@ngxs/store'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'

@Injectable()
export class EventProfileFacade extends GenericEventElementFacade<EventProfileModel> {
    public get page (): Observable<PageModel<EventProfileModel> | undefined> {
        return this.ngStore.select( (state: StateModel): PageModel<EventProfileModel> | undefined => state.eventProfile.eventProfiles.element )
    }

    public get actualPageSearched (): string | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): string | undefined => state.eventProfile.eventProfiles.params.searched )
    }

    public get actualPageDateRange (): Date[] | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): Date[] | undefined => FormUtil.buildDateRange(
            state.eventProfile.eventProfiles.params.startAccess,
            state.eventProfile.eventProfiles.params.endAccess,
        ) )
    }

    public get actualPageStatus (): ProfileStatusEnum | undefined {
        return this.ngStore.selectSnapshot( (state: StateModel): ProfileStatusEnum | undefined => state.eventProfile.eventProfiles.params.status )
    }

    public get actualPageOnlyVisible (): boolean {
        return this.ngStore.selectSnapshot( (state: StateModel): boolean => state.eventProfile.eventProfiles.params.onlyVisible )
    }

    public get actualPageOrder (): OrderEnum {
        return this.ngStore.selectSnapshot( (state: StateModel): OrderEnum => state.eventProfile.eventProfiles.params.order )
    }

    public get pageLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.eventProfile.eventProfiles.loading )
    }

    public get pageSilentLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.eventProfile.eventProfiles.silentLoading )
    }

    public get pageError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.eventProfile.eventProfiles.error )
    }

    public get element (): Observable<EventProfileModel | undefined> {
        return this.ngStore.select( (state: StateModel): EventProfileModel | undefined => state.eventProfile.eventProfile.element )
    }

    public get elementLoading (): Observable<boolean> {
        return this.ngStore.select( (state: StateModel): boolean => state.eventProfile.eventProfile.loading )
    }

    public get elementError (): Observable<ToastMessageOptions | undefined> {
        return this.ngStore.select( (state: StateModel): ToastMessageOptions | undefined => state.eventProfile.eventProfile.error )
    }

    public get searchedUsers (): Observable<SelectItem<UserDto>[]> {
        return this.ngStore.select( (state: StateModel): SelectItem<UserDto>[] => state.eventProfile.searched )
    }

    public get assignableRoles (): Observable<SelectItem<string>[]> {
        return this.ngStore.select( (state: StateModel): SelectItem<string>[] => state.eventProfile.roles )
    }

    public startPageLoader (): void {
        this.ngStore.dispatch( StartEventProfilesPageLoader )
    }

    public stopPageLoader (): void {
        this.ngStore.dispatch( StopEventProfilesPageLoader )
    }

    public fetchElementPage (
        offset: number | undefined,
        limit: number | undefined,
        force: boolean,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new FetchEventProfilePage( eventId, offset, limit, force ) )
    }

    public inputPageSearch (searched: string | undefined): void {
        this.ngStore.dispatch( new InputEventProfilePageSearch( searched ) )
    }

    public inputPageDateRange (range: Date[] | undefined): void {
        this.ngStore.dispatch( new InputEventProfilePageDateRange( range?.[0], range?.[1] ) )
    }

    public selectPageStatus (status: ProfileStatusEnum | undefined): void {
        this.ngStore.dispatch( new SelectEventProfilePageStatus( status ) )
    }

    public selectPageVisibility (onlyVisible: boolean): void {
        this.ngStore.dispatch( new SelectEventProfilePageVisibility( onlyVisible ) )
    }

    public selectPageOrder (order: OrderEnum): void {
        this.ngStore.dispatch( new SelectEventProfilePageOrder( order ) )
    }

    public startElementLoader (): void {
        this.ngStore.dispatch( StartEventProfileLoader )
    }

    public stopElementLoader (): void {
        this.ngStore.dispatch( StopEventProfileLoader )
    }

    public fetchElement (id: string, eventId: string | undefined = this.actualSelectedEventId): void {
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

    public createElements (
        profiles: EventProfilesDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<CreateEventProfiles> {
        this.ngStore.dispatch( new CreateEventProfiles( eventId, profiles ) )
        return this.actions$.pipe( ofActionSuccessful( CreateEventProfiles ) )
    }

    public updateElement (
        id: string,
        profile: EventProfileDto,
        eventId: string | undefined = this.actualSelectedEventId,
    ): Observable<UpdateEventProfile> {
        this.ngStore.dispatch( new UpdateEventProfile( eventId, id, profile ) )
        return this.actions$.pipe( ofActionSuccessful( UpdateEventProfile ) )
    }

    public createSupportEventProfile (eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new CreateSupportEventProfile( eventId ) )
    }

    public blockEventProfile (
        element: EventProfileModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new BlockEventProfile( eventId, element ) )
    }

    public unblockEventProfile (
        element: EventProfileModel,
        eventId: string | undefined = this.actualSelectedEventId,
    ): void {
        this.ngStore.dispatch( new UnblockEventProfile( eventId, element ) )
    }

    public deleteElement (element: EventProfileModel, eventId: string | undefined = this.actualSelectedEventId): void {
        this.ngStore.dispatch( new DeleteEventProfile( eventId, element ) )
    }
}
