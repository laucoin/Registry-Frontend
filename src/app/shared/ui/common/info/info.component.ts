import { Component } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Objectif: Contenu d'accueil et d'aide.
 * Périmètre: Explique l'application à l'utilisateur.
 * Limites: Contenu statique ; ne lit aucune donnée.
 */
@Component({
	selector: 'app-info',
	imports: [TranslocoPipe],
	template:
		'<p data-test-id="info-paragraph">{{ \'global.welcome.introduction\' | transloco }}</p>\n' +
		'<p data-test-id="info-paragraph">{{ \'global.welcome.option\' | transloco }}</p>\n' +
		'<p data-test-id="info-paragraph">{{ \'global.welcome.invitations\' | transloco }}</p>\n' +
		'<p data-test-id="info-paragraph">{{ \'global.welcome.conclusion\' | transloco }}</p>',
})
export class InfoComponent {}
