import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { SessionFacade } from '@core/registry/state/session.facade'
import { SelectItem } from 'primeng/api'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { map, Observable } from 'rxjs'
import { GenericHelper } from '@shared/helpers/generic.helper'

export const alertOptionGuard: CanActivateFn = (): Promise<boolean> | Observable<boolean> | boolean => {
    const sessionFacade: SessionFacade = inject( SessionFacade )

    if (GenericHelper.isNull( sessionFacade.currentUser() )) {
        return sessionFacade.currentUser$.pipe(
            map( (): boolean => hasAlertOption( sessionFacade ) ),
        )
    }

    return hasAlertOption( sessionFacade )
}

function hasAlertOption (sessionFacade: SessionFacade): boolean {
    return sessionFacade.selectedProject()?.options?.some( (option: SelectItem<ProjectOptionEnum>): boolean => option.value === ProjectOptionEnum.ALERT ) ?? false
}
