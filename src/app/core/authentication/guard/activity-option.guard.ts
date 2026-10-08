import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { map, Observable } from 'rxjs'

export const activityOptionGuard: CanActivateFn = (): Promise<boolean> | Observable<boolean> | boolean => {
    const sessionFacade: SessionFacade = inject( SessionFacade )

    if (GenericHelper.isNull( sessionFacade.currentUser() )) {
        return sessionFacade.currentUser$.pipe(
            map( (): boolean => hasActivityOption( sessionFacade ) ),
        )
    }

    return hasActivityOption( sessionFacade )
}

function hasActivityOption (sessionFacade: SessionFacade): boolean {
    return sessionFacade.selectedProject()?.options?.some( (option: SelectItem<ProjectOptionEnum>): boolean => option.value === ProjectOptionEnum.ACTIVITY ) ?? false
}
