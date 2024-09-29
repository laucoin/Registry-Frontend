import { Component, effect, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { Observable, Subscription } from 'rxjs'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { UserAuthorityEnum } from '../../util-model/enumeration/user-authority.enum'
import { EventAuthorityEnum } from '../../util-model/enumeration/event-authority.enum'
import { CurrentUserUtil } from '../../util-authentication/tool/current-user.util'
import { ActivatedRoute, Router } from '@angular/router'
import { GenericUtil } from '../util/generic.util'
import { EventModel } from '../../util-model/model/event.model'
import { Message } from 'primeng/api'

const EVENT_ID_REGEX: RegExp = /events\/([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})/

@Component( {
    template: '',
} )
export abstract class GenericComponent implements OnDestroy {
    protected readonly subscriptions: Subscription = new Subscription()
    protected readonly registryFacade: RegistryFacade = inject( RegistryFacade )
    protected readonly translateService: TranslateService = inject( TranslateService )
    protected readonly route: ActivatedRoute = inject( ActivatedRoute )
    protected readonly router: Router = inject( Router )

    protected readonly UserAuthority: typeof UserAuthorityEnum = UserAuthorityEnum
    protected readonly EventAuthority: typeof EventAuthorityEnum = EventAuthorityEnum
    protected readonly GenericUtil: typeof GenericUtil = GenericUtil

    protected readonly currentUser$: Observable<CurrentUserModel | undefined> = this.registryFacade.currentUser
    protected readonly tinyScreenMediaQuery: MediaQueryList = window.matchMedia( '(max-width: 768px)' )
    protected readonly isTinyScreen: WritableSignal<boolean> = signal( this.tinyScreenMediaQuery.matches )

    protected readonly contextEventId: WritableSignal<string | undefined> = signal( undefined )
    protected readonly contextEvent$: Observable<EventModel | undefined> = this.registryFacade.contextEvent
    protected readonly contextEventLoading$: Observable<boolean> = this.registryFacade.contextEventLoading
    protected readonly contextEventError$: Observable<Message | undefined> = this.registryFacade.contextEventError

    public constructor () {
        this.listenWindowsResize()

        this.handleEventIdFromRoute()
    }

    protected get isMobile (): boolean {
        return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test( navigator.userAgent ))
    }

    protected hasUserAuthority (
        currentUser: CurrentUserModel | undefined | null,
        authority: UserAuthorityEnum,
    ): boolean {
        return CurrentUserUtil.hasUserAuthority( currentUser ?? undefined, authority )
    }

    protected hasEventAuthority (
        currentUser: CurrentUserModel | undefined | null,
        eventId: string | undefined | null,
        authority: EventAuthorityEnum,
    ): boolean {
        return CurrentUserUtil.hasEventAuthority( currentUser ?? undefined, eventId ?? undefined, authority )
    }

    protected buildUri (route: string): string {
        const contextEventId: string | undefined = this.contextEventId() ?? this.registryFacade.actualCurrentUser?.preferences.selectedProfile?.event.id
        return route.includes( ':eventId' ) && contextEventId ? route.replace( ':eventId', contextEventId ) : route
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    private listenWindowsResize (): void {
        this.tinyScreenMediaQuery.addEventListener( 'change', (e: MediaQueryListEvent): void => {
            this.isTinyScreen.set( e.matches )
        } )
    }

    private handleEventIdFromRoute (): void {
        this.subscriptions.add(
            this.route.params.subscribe( (): void => {
                const contextEventId: string | undefined = EVENT_ID_REGEX.exec( location.pathname )?.[1]
                if (contextEventId && contextEventId !== this.contextEventId()) {
                    this.contextEventId.set( contextEventId )
                }
            } ),
        )
    }

    protected fetchContextEventOnEventIdChange (): void {
        effect( (): void => {
            if (
                GenericUtil.nonNull( this.contextEventId() ) &&
                this.registryFacade.actualContextEventId != this.contextEventId()
            ) {
                this.registryFacade.fetchContextEvent( this.contextEventId()! )
            }
        } )
    }
}
