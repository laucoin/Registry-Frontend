import {Injectable} from '@angular/core'
import { Observable, map } from 'rxjs'
import {GenericApi} from '@shared/helpers/api/generic.api'
import {PreferencesModel} from '@shared/models/model/preferences.model'
import { PreferencesResponseDto } from '@shared/models/dto/response/preferences.response.dto'
import { PreferencesMapper } from '@shared/mappers/preferences.mapper'

/**
 * Purpose: Envoie les requêtes HTTP du domaine des préférences.
 * Scope: Construit les urls et les paramètres de requête et renvoie les réponses du backend.
 * Limits: Ne détient aucun état et ne gère aucune erreur ; les stores et les facades le font.
 */
@Injectable({
    providedIn: 'root',
})
export class PreferencesApi extends GenericApi {
    public constructor() {
        super('/api/v2/users/preferences')
    }

    public updateTheme(theme: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesResponseDto>(
            `${this.baseUrl}/theme`,
            null,
            { params: { theme } },
        ).pipe(
            map( PreferencesMapper.toModel ),
        )
    }

    public updateRefreshMode(mode: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesResponseDto>(
            `${this.baseUrl}/refresh-mode`,
            null,
            { params: { mode } },
        ).pipe(
            map( PreferencesMapper.toModel ),
        )
    }

    public updateLanguage(language: string): Observable<PreferencesModel> {
        return this.http.post<PreferencesResponseDto>(
            `${this.baseUrl}/language`,
            null,
            { params: { language } },
        ).pipe(
            map( PreferencesMapper.toModel ),
        )
    }
}
