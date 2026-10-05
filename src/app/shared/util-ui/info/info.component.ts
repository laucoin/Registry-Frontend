import { Component } from '@angular/core'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
	selector: 'app-info',
	imports: [
		TranslatePipe,
	],
	template: '<p>{{ \'global.welcome.introduction\' | translate }}</p>\n' +
		'<p>{{ \'global.welcome.option\' | translate }}</p>\n' +
		'<p>{{ \'global.welcome.invitations\' | translate }}</p>\n' +
		'<p>{{ \'global.welcome.conclusion\' | translate }}</p>',
})
export class InfoComponent {
}
