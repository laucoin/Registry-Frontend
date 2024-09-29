import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { SessionStorageUtils } from '../../shared/util-tool/util/session-storage.util'
import { REDIRECT_URI } from '../../shared/util-tool/util/request.util'

@Component( {
    selector: 'app-auth-callback',
    standalone: true,
    template: '',
} )
export class AuthCallbackComponent implements OnInit {
    public constructor (private readonly router: Router) {}

    public ngOnInit (): void {
        this.router.navigateByUrl( SessionStorageUtils.get( REDIRECT_URI )?.toString() ?? '' ).then()
    }
}
