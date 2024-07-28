import { MessageService } from 'primeng/api'
import { Router } from '@angular/router'
import { inject } from '@angular/core'

export abstract class GenericState {
    protected readonly notifyService: MessageService
    protected readonly router: Router

    protected constructor () {
        this.notifyService = inject( MessageService )
        this.router = inject( Router )
    }

    protected notifyError (message: string): void {
        this.notifyService.add( {
            severity: 'danger',
            summary: 'Error',
            detail: message,
        } )
    }
}
