import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ConfigModel } from '@core/config/model/config.model'
import { EnvironmentModel } from '@core/config/model/environment.model'
import { RegistryConfig } from '@core/config/registry.config'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'

/**
 * Purpose: Static terms-of-service page, personalized with the organization, creator and hosting information.
 * Scope: Renders the translated legal copy with the runtime configuration values interpolated.
 * Limits: Does not fetch data or hold any state of its own.
 */
@Component({
	selector: 'app-terms',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe],
	providers: [provideTranslocoScope('terms')],
	templateUrl: './terms.page.html',
	styleUrl: '../../shared/ui/common/legal-document/legal-document.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPage {
	protected readonly updatedAt: string = new Date("2024-10-09").toLocaleDateString()
	protected readonly hosting: EnvironmentModel['hosting'] = RegistryConfig.environment.hosting
	protected readonly orgParams: {
		organizationName: string,
		creatorName: string,
		creatorEmail: string
	} = this.buildOrgParams(RegistryConfig.config.application)

	private buildOrgParams(application: ConfigModel['application']): {
		organizationName: string,
		creatorName: string,
		creatorEmail: string
	} {
		return {
			organizationName: application.organization,
			creatorName: application.creator.name,
			creatorEmail: application.creator.email,
		}
	}
}
