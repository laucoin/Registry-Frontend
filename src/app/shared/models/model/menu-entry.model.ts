export interface MenuEntryModel {
    id?: string | undefined
    label?: string | undefined
    icon?: string | undefined
    url?: string | undefined
    visible?: boolean | undefined
    disabled?: boolean | undefined
    separator?: boolean | undefined
    items?: MenuEntryModel[] | undefined
    command?: ((event: { originalEvent?: Event | undefined, item?: MenuEntryModel | undefined }) => void) | undefined
}
