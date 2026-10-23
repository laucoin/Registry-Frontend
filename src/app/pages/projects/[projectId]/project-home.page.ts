import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core'
import { CurrentUserHelper } from "@core/authentication/tool/current-user.helper";
import { ProjectAuthorityEnum } from "@shared/models/enumeration/project-authority.enum";
import { SessionFacade } from "@core/registry/state/session.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { ProjectOptionEnum } from "@shared/models/enumeration/project-option.enum";
import { ProjectModel } from "@shared/models/model/project.model";
import { ProjectActiveAlertComponent } from "@shared/ui/domain/project-active-alert/project-active-alert.component";
import { ProjectBirthdayComponent } from "@shared/ui/domain/project-birthday/project-birthday.component";
import {
	ProjectOperationalMonitoringComponent
} from "@shared/ui/domain/project-operational-monitoring/project-operational-monitoring.component";
import {
	ProjectParticipantOverviewComponent
} from "@shared/ui/domain/project-participant-overview/project-participant-overview.component";
import {
	ProjectParticipantRegularizationComponent
} from "@shared/ui/domain/project-participant-regularization/project-participant-regularization.component";
import {
	ProjectUpcomingArrivalComponent
} from "@shared/ui/domain/project-upcoming-arrival/project-upcoming-arrival.component";
import {
	ProjectUpcomingDepartureComponent
} from "@shared/ui/domain/project-upcoming-departure/project-upcoming-departure.component";
import {
	ProjectVehicleOverviewComponent
} from "@shared/ui/domain/project-vehicle-overview/project-vehicle-overview.component";

/**
 * Purpose: Home page of the selected project.
 * Scope: Loads the project home information and shows the dashboard.
 * Limits: Reads through the selected project facade only.
 */
@Component({
	selector: 'app-project-home',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	imports: [
		TranslocoPipe,
		ProjectParticipantOverviewComponent,
		ProjectParticipantRegularizationComponent,
		ProjectActiveAlertComponent,
		ProjectUpcomingArrivalComponent,
		ProjectUpcomingDepartureComponent,
		ProjectBirthdayComponent,
		ProjectOperationalMonitoringComponent,
		ProjectVehicleOverviewComponent
	],
	templateUrl: './project-home.page.html',
})
export class ProjectHomePage {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly project: Signal<ProjectModel | undefined> = this.sessionFacade.selectedProject
	protected readonly hasVehicleOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.VEHICLE)
	protected readonly canSeePlannedMovements: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
		this.sessionFacade.currentUser(),
		this.sessionFacade.currentProjectId(),
		ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
	))
	protected readonly hasAlertOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.ALERT)
}
