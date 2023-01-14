import { deg2Rad } from "@lincode/math"
import IJoint, { jointDefaults, jointSchema } from "../interface/IJoint"
import { getPhysX } from "../states/usePhysX"
import JointBase from "./core/JointBase"
import PhysicsObjectManager from "./core/PhysicsObjectManager"
import destroy from "./core/PhysicsObjectManager/physx/destroy"

const createLimitedSpherical = (
    actor0: any,
    pose0: any,
    actor1: any,
    pose1: any,
    yLimitAngle: number,
    zLimitAngle: number
) => {
    const { physics, Px, PxJointLimitCone, PxSphericalJointFlagEnum } =
        getPhysX()

    const joint = Px.SphericalJointCreate(physics, actor0, pose0, actor1, pose1)
    const cone = new PxJointLimitCone(
        yLimitAngle * deg2Rad,
        zLimitAngle * deg2Rad,
        0.05
    )
    joint.setLimitCone(cone)
    destroy(cone)
    joint.setSphericalJointFlag(PxSphericalJointFlagEnum.eLIMIT_ENABLED(), true)
    return joint
}

export default class Joint extends JointBase implements IJoint {
    public static componentName = "joint"
    public static defaults = jointDefaults
    public static schema = jointSchema

    public constructor() {
        super()
        this.yLimitAngle = 30
        this.zLimitAngle = 30
    }

    protected createJoint(
        fromPxTransform: any,
        toPxTransform: any,
        fromManager: PhysicsObjectManager,
        toManager: PhysicsObjectManager
    ) {
        return createLimitedSpherical(
            fromManager.actor,
            fromPxTransform,
            toManager.actor,
            toPxTransform,
            this._yLimitAngle,
            this._zLimitAngle
        )
    }

    private _yLimitAngle = 360
    public get yLimitAngle() {
        return this._yLimitAngle
    }
    public set yLimitAngle(val) {
        this._yLimitAngle = val
        this.refreshState.set({})
    }

    private _zLimitAngle = 360
    public get zLimitAngle() {
        return this._zLimitAngle
    }
    public set zLimitAngle(val) {
        this._zLimitAngle = val
        this.refreshState.set({})
    }
}
