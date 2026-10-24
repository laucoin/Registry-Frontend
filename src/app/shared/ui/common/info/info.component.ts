import { Component } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'

/**
 * Purpose: Contenu d'accueil et d'aide.
 * Scope: Explique l'application à l'utilisateur.
 * Limits: Contenu statique ; ne lit aucune donnée.
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
