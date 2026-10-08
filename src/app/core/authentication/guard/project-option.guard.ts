import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { map, Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

/**
 * Purpose: Builds route guards that only let through projects having a given option enabled.
 * Scope: Waits for the current user to be known, then checks the options of the selected project.
 * Limits: A usability aid only; the backend re-checks the option on every request.
 */
export function projectOptionGuard (option: ProjectOptionEnum): CanActivateFn {
    return (): Observable<boolean> | boolean => {
        const sessionFacade: SessionFacade = inject( SessionFacade )

        if (GenericHelper.isNull( sessionFacade.currentUser() )) {
            return sessionFacade.currentUser$.pipe( map( (): boolean => hasOption( sessionFacade, option ) ) )
        }

        return hasOption( sessionFacade, option )
    }
}

function hasOption (sessionFacade: SessionFacade, option: ProjectOptionEnum): boolean {
    return sessionFacade.selectedProject()?.options?.some( (item: SelectItem<ProjectOptionEnum>): boolean => item.value === option ) ?? false
}

export const activityOptionGuard: CanActivateFn = projectOptionGuard( ProjectOptionEnum.ACTIVITY )
export const alertOptionGuard: CanActivateFn = projectOptionGuard( ProjectOptionEnum.ALERT )
export const vehicleOptionGuard: CanActivateFn = projectOptionGuard( ProjectOptionEnum.VEHICLE )
