import { ExtractProps } from "./utils/extractProps"
import { extendDefaults } from "./utils/Defaults"
import ISimpleObjectManager, {
    simpleObjectManagerDefaults,
    simpleObjectManagerSchema
} from "./ISimpleObjectManager"

export default interface ISkyLight extends ISimpleObjectManager {
    intensity: number
    cascadeShadow: boolean
}

export const skyLightSchema: Required<ExtractProps<ISkyLight>> = {
    ...simpleObjectManagerSchema,
    intensity: Number,
    cascadeShadow: Boolean
}

export const skyLightDefaults = extendDefaults<ISkyLight>(
    [simpleObjectManagerDefaults],
    { intensity: 1, cascadeShadow: false }
)
