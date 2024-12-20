import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { SessionStorageUtils } from '../../shared/util-tool/util/session-storage.util'
import { REDIRECT_URI } from '../../shared/util-tool/util/request.util'
import { AppRouteEnum } from '../../app-route.enum'

@Component( {
    selector: 'app-sign-out-callback',
    standalone: true,
    template: '',
} )
export class SignOutCallbackComponent implements OnInit {
    public constructor (private readonly router: Router) {}

    public ngOnInit (): void {
        this.router.navigateByUrl( SessionStorageUtils.get( REDIRECT_URI )?.toString() ?? AppRouteEnum.HOME ).then()
    }
}
