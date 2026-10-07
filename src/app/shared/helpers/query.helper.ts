import { HttpParams } from '@angular/common/http'
import { GenericHelper } from '@shared/helpers/generic.helper'

export class QueryHelper {
    public static buildQueryParams (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        params: object | undefined,
    ): HttpParams {
        let builtParams: HttpParams = new HttpParams()
            .set( 'pageNumber', pageNumber ?? 0 )
            .set( 'pageSize', pageSize ?? 20 )

        if (GenericHelper.isNull( params )) return builtParams

        Object.entries( params! ).forEach( ([ key, value ]: [ string, string | number | boolean | undefined ]): void => {
            if (GenericHelper.nonNull( value ) && key !== 'resetSearch') builtParams = builtParams.set( key, value! )
        } )

        return builtParams
    }
}
