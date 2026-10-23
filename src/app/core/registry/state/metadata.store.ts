import { signalStore, withState } from '@ngrx/signals'
import { SelectItem } from 'primeng/api'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'
import { RegistryConfig } from '@core/config/registry.config'

interface MetadataStoreModel {
    themes: SelectItem<ThemeEnum>[]
    languages: SelectItem<string>[]
}

export const MetadataStore = signalStore(
    { providedIn: 'root' },
    withState<MetadataStoreModel>( () => ({
        themes: [
            { icon: 'pi pi-desktop', value: ThemeEnum.SYSTEM },
            { icon: 'pi pi-sun', value: ThemeEnum.LIGHT },
            { icon: 'pi pi-moon', value: ThemeEnum.DARK },
        ],
        languages: RegistryConfig.config.languages.map( (lang: string): SelectItem<string> => ({
            label: 'global.language.' + lang,
            value: lang,
        }) ),
    }) ),
)
