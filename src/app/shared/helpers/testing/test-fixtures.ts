import { Observable, throwError } from 'rxjs'
import { ConfigModel } from '@core/config/model/config.model'
import { RegistryConfig } from '@core/config/registry.config'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'

export const ERROR_500: ErrorModel = { status: 500, title: 'Title', message: 'Message' } as ErrorModel
export const ERROR_503: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel

export function pageOf<T extends GenericModel> (content: T[], pageNumber: number = 0): PageModel<T> {
    return { pageNumber, pageSize: 10, totalElements: content.length, totalPages: 1, content, lastRefresh: new Date() }
}

export function failing<T = never> (error: ErrorModel): Observable<T> {
    return throwError( (): ErrorModel => error )
}

export function provideTestConfig (): void {
    RegistryConfig.config = {
        defaultLanguage: 'fr',
        languages: [ 'fr', 'en' ],
        notification: { duration: { info: 1, success: 1, warn: 1, error: 1, secondary: 1, contrast: 1 } },
    } as unknown as ConfigModel
}
