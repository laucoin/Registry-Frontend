import '@sgdf/ui/button'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterOutlet } from "@angular/router";
import { TranslocoPipe } from '@jsverse/transloco';
import { FooterComponent } from "@core/layout/footer/footer.component";
import { NavbarComponent } from "@core/layout/navbar/navbar.component";

/**
 * Purpose: Coque des pages authentifiées.
 * Scope: Encadre la page routée entre la barre de navigation et le pied de page.
 * Limits: Ne détient aucun état et ne contient aucune logique métier.
 */
@Component({
	selector: 'app-main',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './main.component.html',
	styleUrl: './main.component.css',
	imports: [
		RouterOutlet,
		NavbarComponent,
		FooterComponent,
		TranslocoPipe,
	]
})
export class MainComponent {
	protected focusContent(event: Event, content: HTMLElement): void {
		event.preventDefault()
		content.focus()
	}
}
