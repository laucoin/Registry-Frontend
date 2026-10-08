import { Component } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'

/**
 * Purpose: Welcome and help content.
 * Scope: Explains the application to the user.
 * Limits: Static content; it does not read data.
 */
@Component( {
    selector: 'app-info',
    imports: [
        TranslocoPipe,
    ],
    template: '<p>{{ \'global.welcome.introduction\' | transloco }}</p>\n' +
              '<p>{{ \'global.welcome.option\' | transloco }}</p>\n' +
              '<p>{{ \'global.welcome.invitations\' | transloco }}</p>\n' +
              '<p>{{ \'global.welcome.conclusion\' | transloco }}</p>',
} )
export class InfoComponent {}
