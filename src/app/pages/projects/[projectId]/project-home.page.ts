import '@sgdf/ui/button'
import '@sgdf/ui/drawer'
import '@sgdf/ui/icon'
import '@sgdf/ui/page-title'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UiFacade } from '@core/registry/state/ui.facade'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { EventHelper } from '@shared/helpers/event.helper'
import { RouteHelper } from '@shared/helpers/route.helper'
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component'
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
 * Purpose: Page d'accueil du projet sélectionné.
 * Scope: Charge les informations d'accueil du projet, affiche le tableau de bord et propose les raccourcis de création d'un mouvement ou d'une alerte.
 * Limits: Lit uniquement via la facade du projet sélectionné.
 */
@Component({
	selector: 'app-project-home',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	imports: [
		TranslocoPipe,
		RouterLink,
		CommunicationFormComponent,
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

	protected readonly uiFacade: UiFacade = inject(UiFacade)

	protected readonly project: Signal<ProjectModel | undefined> = this.sessionFacade.selectedProject
	protected readonly hasVehicleOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.VEHICLE)
	protected readonly canSeePlannedMovements: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
		this.sessionFacade.currentUser(),
		this.sessionFacade.currentProjectId(),
		ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_C,
	))
	protected readonly hasAlertOption: Signal<boolean> = this.sessionFacade.selectedProjectHasOption(ProjectOptionEnum.ALERT)
	protected readonly canCreateMovement: Signal<boolean> = this.canSeePlannedMovements
	protected readonly canCreateAlert: Signal<boolean> = computed((): boolean => this.hasAlertOption() && CurrentUserHelper.hasProjectAuthority(
		this.sessionFacade.currentUser(),
		this.sessionFacade.currentProjectId(),
		ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_C,
	))
	protected readonly creatingAlert: WritableSignal<boolean> = signal(false)

	protected readonly registeredMovementRoute: Signal<string> = computed((): string => this.projectRoute(RegistryRouteEnum.PROJECTS_MOVEMENTS_REGISTERED_CREATION))
	protected readonly guestMovementRoute: Signal<string> = computed((): string => this.projectRoute(RegistryRouteEnum.PROJECTS_MOVEMENTS_GUEST_CREATION))

	protected closeAlertDrawer(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.creatingAlert.set(false)
		}
	}

	private projectRoute(route: RegistryRouteEnum): string {
		return RouteHelper.absolute(route).replace(':projectId', this.sessionFacade.currentProjectId() ?? '')
	}
}
