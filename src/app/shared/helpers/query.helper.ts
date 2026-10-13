import { HttpParams } from '@angular/common/http'
import { GenericHelper } from '@shared/helpers/generic.helper'

/**
 * Purpose: Builds the query string of paged requests.
 * Scope: Adds page number, page size and the defined search criteria, never the reset flag.
 * Limits: Does not encode complex values; callers pass primitives.
 */
export class QueryHelper {
    public static buildQueryParams (
        page: number | undefined,
        size: number | undefined,
        params: object | undefined,
    ): HttpParams {
        let builtParams: HttpParams = new HttpParams()
            .set( 'page', page ?? 0 )
            .set( 'size', size ?? 20 )

        if (GenericHelper.isNull( params )) return builtParams

        Object.entries( params! ).forEach( ([ key, value ]: [ string, string | number | boolean | undefined ]): void => {
            if (GenericHelper.nonNull( value ) && key !== 'resetSearch') builtParams = builtParams.set( key, value! )
        } )

        return builtParams
    }
}
