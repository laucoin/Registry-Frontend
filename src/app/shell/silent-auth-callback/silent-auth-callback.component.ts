import { Component, OnInit } from '@angular/core'
import { Store } from '@ngxs/store'
import { RefreshToken } from '../../shared/util-auth/auth.action'
import { LoaderComponent } from '../../shared/util-ui/loader/loader.component'

@Component( {
    selector: 'app-silent-auth-callback',
    standalone: true,
    imports: [
        LoaderComponent,
    ],
    template: '<app-loader/>',
} )
export class SilentAuthCallbackComponent implements OnInit {
    public constructor (private readonly store: Store) {}

    public ngOnInit (): void {
        this.store.dispatch( RefreshToken )
    }
}
