import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { TranslateModule } from '@ngx-translate/core'
import { combineLatestWith, map, Observable, of } from 'rxjs'
import { AppConfig } from '../../app.config'
import { AppRouteEnum } from '../../app-route.enum'
import { CurrentUserModel } from '../../shared/util-model/model/current-user.model'
import { GenericComponent } from '../../shared/util-tool/component/generic.component'
import { MenuItemModel } from '../data/model/menu-item.model'
import { CurrentUserUtil } from '../../shared/util-authentication/tool/current-user.util'
import { Button } from 'primeng/button'
import { Drawer } from 'primeng/drawer'
import { RouterLink } from '@angular/router'
import { TruncatePipe } from '../../shared/util-tool/pipe/truncate.pipe'
import { Ripple } from 'primeng/ripple'
import { StringUtils } from '../../shared/util-tool/util/string.util'

@Component( {
    selector: 'app-side-bar',
    standalone: true,
    imports: [
        NgIf,
        AsyncPipe,
        TranslateModule,
        Button,
        Drawer,
        RouterLink,
        NgOptimizedImage,
        TruncatePipe,
        Ripple,
    ],
    templateUrl: './side-bar.component.html',
    styleUrl: './side-bar.component.scss',
} )
export class SideBarComponent extends GenericComponent implements OnInit {
    protected readonly homeMenuItem: MenuItemModel = {
        name: 'menu.home',
        icon: 'pi pi-home',
        route: AppRouteEnum.HOME,
        requiredUserAuthority: undefined,
        requiredEventAuthority: undefined,
        requiredEventOption: undefined,
        enabled: true,
    }

    protected readonly maxMenuTextLength: number = 26

    protected readonly logoPath$: Observable<string> = this.registryFacade.logoPath
    protected menuItems$: Observable<MenuItemModel[]> = of( [] )
    protected isSidebarOpen: boolean = !this.isMobile() && !this.isTinyScreen()

    protected form!: FormGroup

    public constructor (private readonly titleService: Title) {
        super()
    }

    public ngOnInit (): void {
        this.handleTinyScreen()

        this.handleCurrentUser()
    }

    protected closeMenuOnTinyScreen (): void {
        if (this.tinyScreenMediaQuery.matches) this.isSidebarOpen = false
    }

    protected settingsMenuItem (currentUser: CurrentUserModel): MenuItemModel {
        return {
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            icon: 'pi pi-user',
            route: AppRouteEnum.PREFERENCES,
            requiredUserAuthority: undefined,
            requiredEventAuthority: undefined,
            requiredEventOption: undefined,
            enabled: true,
        }
    }

    protected isRouteActive (route: AppRouteEnum): boolean {
        const isActive: boolean = StringUtils.isRouteActive( route )
        if (isActive) {
            const params: object = {
                menu: this.translateService.instant( `menu.${route.replace(
                    'events/:eventId/',
                    '',
                ).replace( '/', '-' )}` ),
            }
            this.titleService.setTitle( this.translateService.instant( 'title', params ) )
        }

        return isActive
    }

    protected signOut (): void {
        this.registryFacade.logout()
    }

    private handleTinyScreen (): void {
        this.tinyScreenMediaQuery.addEventListener( 'change', (e: MediaQueryListEvent): void => {
            this.isSidebarOpen = !e.matches
        } )
    }

    private handleCurrentUser (): void {
        this.menuItems$ = this.currentUser$.pipe(
            combineLatestWith( of( AppConfig.config.menu ) ),
            map( ([ currentUser, menuItems ]: [ CurrentUserModel | undefined, MenuItemModel[] ]): MenuItemModel[] => this.filterMenuItems(
                currentUser,
                menuItems,
            ) ),
        )
    }

    private filterMenuItems (currentUser: CurrentUserModel | undefined, menuItems: MenuItemModel[]): MenuItemModel[] {
        if (!currentUser) return []
        return menuItems.filter( (item: MenuItemModel): boolean => CurrentUserUtil.isFeasible(
                currentUser,
                currentUser?.preferences?.selectedProfile?.event,
                item,
            ),
        )
    }
}
