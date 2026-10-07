import { Component, computed, HostListener, inject, signal, Signal, WritableSignal } from '@angular/core'
import { Menubar } from 'primeng/menubar'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { Avatar } from 'primeng/avatar'
import { TranslatePipe } from '@ngx-translate/core'
import { RouterEvent, RouterLink } from '@angular/router'
import { Popover } from 'primeng/popover'
import { Menu } from 'primeng/menu'
import { Ripple } from 'primeng/ripple'
import { MenuItem } from 'primeng/api'
import { Button } from 'primeng/button'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { MenuItemModel } from '@core/shell/data/model/menu-item.model'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { StringHelper } from '@shared/helpers/string.helper'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe'
import { toSignal } from '@angular/core/rxjs-interop'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { Dialog } from 'primeng/dialog'
import { InfoComponent } from '@shared/ui/info/info.component'

@Component( {
    selector: 'app-navbar',
    imports: [
        Menubar,
        Avatar,
        TranslatePipe,
        RouterLink,
        Popover,
        Menu,
        Ripple,
        Button,
        TruncatePipe,
        Dialog,
        InfoComponent,
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
} )
export class NavbarComponent extends GenericComponent {
    private readonly iconOption: ProjectOptionIconPipe = inject( ProjectOptionIconPipe )

    protected readonly maxMenuTextLength: number = 26
    protected readonly userMenuItems: Signal<MenuItem[]> = computed( (): MenuItem[] => [
        {
            label: this.translateService.instant( 'global.menu.profiles' ),
            icon: 'pi pi-unlock',
            url: RegistryRouteEnum.USERS_PROFILES,
        },
        {
            label: this.translateService.instant( 'global.menu.invitations' ),
            icon: 'pi pi-envelope',
            url: RegistryRouteEnum.USERS_INVITATIONS,
        },
        {
            label: this.translateService.instant( 'global.menu.settings' ),
            icon: 'pi pi-cog',
            url: RegistryRouteEnum.USERS_SETTINGS,
        },
        {
            label: this.translateService.instant( 'global.menu.help' ),
            icon: 'pi pi-question-circle',
            visible: this.registryFacade.tinyScreen(),
            command: (): void => {
                this.helpDialogOpened = true
            },
        },
    ] )

    protected helpDialogOpened: boolean = false

    private readonly allMenuItems: Signal<MenuItemModel[]> = signal( [
        {
            label: 'global.menu.projects',
            icon: 'pi pi-calendar',
            url: RegistryRouteEnum.PROJECTS,
        },
        {
            label: 'global.menu.users',
            icon: 'pi pi-users',
            url: RegistryRouteEnum.USERS,
            requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_R,
        },
    ] )
    protected readonly menuItems: Signal<MenuItem[]>

    private readonly allContextMenuItems: Signal<MenuItemModel[]> = computed( () => [
        {
            label: 'global.menu.project-home',
            icon: 'pi pi-home',
            url: this.projectUrl( RegistryRouteEnum.PROJECT ),
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
        },
        {
            label: 'global.menu.movements',
            icon: 'pi pi-sort-alt',
            url: this.projectUrl( RegistryRouteEnum.PROJECTS_MOVEMENTS ),
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_R,
        },
        {
            label: 'global.menu.alerts',
            icon: this.iconOption.transform( ProjectOptionEnum.ALERT ),
            url: this.projectUrl( RegistryRouteEnum.PROJECTS_ALERTS ),
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R,
            requiredProjectOption: ProjectOptionEnum.ALERT,
        },
        {
            label: 'global.menu.configuration',
            icon: 'pi pi-cog',
            requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
            items: [
                {
                    label: 'global.menu.edit-project',
                    icon: 'pi pi-pen-to-square',
                    url: this.projectUrl( RegistryRouteEnum.PROJECTS_EDITION ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
                },
                {
                    label: 'global.menu.project-profiles',
                    icon: 'pi pi-unlock',
                    url: this.projectUrl( RegistryRouteEnum.PROJECTS_CONFIGURATION_PROFILES ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_R,
                },
                {
                    label: 'global.menu.participants',
                    icon: 'pi pi-user',
                    url: this.projectUrl( RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_R,
                },
                {
                    label: 'global.menu.groups',
                    icon: 'pi pi-users',
                    url: this.projectUrl( RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R,
                },
                {
                    label: 'global.menu.vehicles',
                    icon: this.iconOption.transform( ProjectOptionEnum.VEHICLE ),
                    url: this.projectUrl( RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R,
                    requiredProjectOption: ProjectOptionEnum.VEHICLE,
                },
                {
                    label: 'global.menu.activities',
                    icon: this.iconOption.transform( ProjectOptionEnum.ACTIVITY ),
                    url: this.projectUrl( RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES ),
                    requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R,
                    requiredProjectOption: ProjectOptionEnum.ACTIVITY,
                },
            ],
        },
    ] )
    protected readonly contextMenuItems: Signal<MenuItem[]>

    protected readonly displayName: Signal<string> = computed( (): string =>
        StringHelper.truncate(
            StringHelper.toTitleCase( this.registryFacade.currentUser()?.firstName ) + ' ' + this.registryFacade.currentUser()?.lastName?.toUpperCase(),
            this.maxMenuTextLength,
        ),
    )
    protected readonly initials: Signal<string> = computed( (): string => StringHelper.truncate(
        this.registryFacade.currentUser()?.firstName,
        1,
    ) + StringHelper.truncate( this.registryFacade.currentUser()?.lastName, 1 ) )

    protected readonly role: Signal<string | undefined> = computed( (): string | undefined => this.registryFacade.currentUser()?.role?.label )

    private readonly activeRoute: Signal<unknown> = toSignal( this.router.events )
    protected readonly showContextMenu: Signal<boolean> = computed( (): boolean => {
        const routeProject: RouterEvent | undefined = this.activeRoute() as RouterEvent | undefined
        return (routeProject?.url?.startsWith( `/${RegistryRouteEnum.PROJECTS}/` ) && !routeProject?.url?.startsWith( `/${RegistryRouteEnum.PROJECTS_CREATION}` )) ?? false
    } )

    private readonly lastScrollPosition: WritableSignal<number> = signal( 0 )
    protected readonly showNavbar: WritableSignal<boolean> = signal( true )

    public constructor () {
        super()
        this.menuItems = computed( (): MenuItem[] => this.showContextMenu() ? [] : this.filterMenuItems(
            this.registryFacade.currentUser(),
            this.allMenuItems(),
        ) )
        this.contextMenuItems = computed( (): MenuItem[] => this.filterMenuItems(
            this.registryFacade.currentUser(),
            this.allContextMenuItems(),
        ) )
    }

    private filterMenuItems (currentUser: CurrentUserModel | undefined, menuItems: MenuItemModel[]): MenuItem[] {
        if (!currentUser) return []

        return menuItems
            .filter( (item: MenuItemModel): boolean => CurrentUserHelper.isFeasible(
                currentUser,
                this.registryFacade.selectedProject(),
                item,
            ) )
            .map( (menuItem: MenuItemModel): MenuItem => ({
                label: menuItem.label,
                icon: menuItem.icon,
                url: menuItem.url,
                items: menuItem.items?.length ? this.filterMenuItems( currentUser, menuItem.items ) : undefined,
            }) )
    }

    @HostListener( 'window:scroll', [] )
    public handleWindowScroll (): void {
        const currentScrollPosition: number = window.pageYOffset || document.documentElement.scrollTop

        if (currentScrollPosition > this.lastScrollPosition() && currentScrollPosition > 25) {
            // Scrolling DOWN
            this.showNavbar.set( false )
        } else {
            // Scrolling UP
            this.showNavbar.set( true )
        }

        this.lastScrollPosition.set( currentScrollPosition )
    }

    private projectUrl (route: RegistryRouteEnum): string {
        return route.replace( ':projectId', this.registryFacade.currentProjectId() ?? '' )
    }

    protected backToProjects (): void {
        this.router.navigateByUrl( RegistryRouteEnum.PROJECTS ).catch( console.error )
    }

    protected logout (): void {
        this.registryFacade.logout()
    }
}
