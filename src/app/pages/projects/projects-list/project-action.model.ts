export interface ProjectActionModel {
    id: string
    label: string
    icon: string
    disabled: boolean
    danger: boolean
    run: () => void
}
