import ID6Joint, {
    d6JointDefaults,
    d6JointSchema
} from "../../interface/ID6Joint"
import { physXPtr } from "../../states/usePhysX"
import JointBase from "../core/JointBase"
import PhysicsObjectManager from "../core/PhysicsObjectManager"

const createD6 = (actor0: any, pose0: any, actor1: any, pose1: any) => {
    const { physics, Px } = physXPtr[0]
    const j = Px.D6JointCreate(physics, actor0, pose0, actor1, pose1)
    return j
}

export default class D6Joint extends JointBase implements ID6Joint {
    public static componentName = "D6Joint"
    public static defaults = d6JointDefaults
    public static schema = d6JointSchema

    private joint?: any

    protected createJoint(
        fromPxTransform: any,
        toPxTransform: any,
        fromManager: PhysicsObjectManager,
        toManager: PhysicsObjectManager
    ) {
        return (this.joint = createD6(
            fromManager.actor,
            fromPxTransform,
            toManager.actor,
            toPxTransform
        ))
    }

    public get distanceLimit() {
        return this.joint?.getDistanceLimit()
    }
    public set distanceLimit(value) {
        this.joint?.setDistanceLimit(value)
    }
}
