import { centroid3d } from "@lincode/math"
import { Cancellable } from "@lincode/promiselikes"
import { Reactive } from "@lincode/reactivity"
import mainCamera from "../engine/mainCamera"
import IJoint, { jointDefaults, jointSchema } from "../interface/IJoint"
import { getCameraRendered } from "../states/useCameraRendered"
import { getPhysX } from "../states/usePhysX"
import MeshManager from "./core/MeshManager"
import PhysicsObjectManager from "./core/PhysicsObjectManager"
import destroy from "./core/PhysicsObjectManager/physx/destroy"
import {
    setPxTransform,
    setPxTransform_
} from "./core/PhysicsObjectManager/physx/pxMath"
import PositionedManager from "./core/PositionedManager"
import { getMeshManagerSets } from "./core/StaticObjectManager"
import { addSelectionHelper } from "./core/StaticObjectManager/raycast/selectionCandidates"
import HelperSphere from "./core/utils/HelperSphere"

const createLimitedSpherical = (
    actor0: any,
    pose0: any,
    actor1: any,
    pose1: any
) => {
    const { physics, Px, PxJointLimitCone, PxSphericalJointFlagEnum } =
        getPhysX()

    const joint = Px.SphericalJointCreate(physics, actor0, pose0, actor1, pose1)
    const cone = new PxJointLimitCone(Math.PI / 2, Math.PI / 2, 0.05)
    joint.setLimitCone(cone)
    destroy(cone)
    joint.setSphericalJointFlag(PxSphericalJointFlagEnum.eLIMIT_ENABLED(), true)
    return joint
}

export default class Joint extends PositionedManager implements IJoint {
    public static componentName = "joint"
    public static defaults = jointDefaults
    public static schema = jointSchema

    public constructor() {
        super()
        import("./core/PhysicsObjectManager/physx")

        this.createEffect(() => {
            if (getCameraRendered() !== mainCamera) return

            const sphere = new HelperSphere()
            sphere.scale = 0.1
            const handle = addSelectionHelper(sphere, this)

            sphere.onTranslateControl = (phase) =>
                phase === "end" && this.setManualPosition()

            return () => {
                handle.cancel()
            }
        }, [getCameraRendered])

        this.createEffect(() => {
            const { physics } = getPhysX()
            const { _to, _from } = this
            if (!physics || !_to || !_from) return

            const [[toManager]] = getMeshManagerSets(_to)
            const [[fromManager]] = getMeshManagerSets(_from)
            if (
                !(toManager instanceof PhysicsObjectManager) ||
                !(fromManager instanceof PhysicsObjectManager)
            )
                return

            !this.manualPosition &&
                Object.assign(this, centroid3d([fromManager, toManager]))

            const fromPhysics = fromManager.physics
            const toPhysics = toManager.physics
            const { parent } = this.outerObject3d

            if (fromManager.physics === true) fromManager.refreshPhysics()
            else fromManager.physics = true
            if (toManager.physics === true) toManager.refreshPhysics()
            else toManager.physics = true

            const handle = new Cancellable()

            queueMicrotask(() => {
                if (handle.done) return

                const p = this.position
                const q = this.quaternion

                fromManager.outerObject3d.attach(this.outerObject3d)
                const pxTransform = setPxTransform(
                    p.x * 0.5,
                    p.y * 0.5,
                    p.z * 0.5,
                    q.x,
                    q.y,
                    q.z,
                    q.w
                )
                toManager.outerObject3d.attach(this.outerObject3d)
                const pxTransform_ = setPxTransform_(
                    p.x * 0.5,
                    p.y * 0.5,
                    p.z * 0.5,
                    q.x,
                    q.y,
                    q.z,
                    q.w
                )
                const joint = createLimitedSpherical(
                    fromManager.actor,
                    pxTransform,
                    toManager.actor,
                    pxTransform_
                )
                handle.then(() => destroy(joint))
            })
            return () => {
                handle.cancel()
                fromManager.physics = fromPhysics
                toManager.physics = toPhysics
                parent?.attach(this.outerObject3d)
            }
        }, [this.refreshState.get, getPhysX])
    }

    public name?: string

    private refreshState = new Reactive({})

    private _to?: string | MeshManager
    public get to() {
        return this._to
    }
    public set to(val) {
        this._to = val
        this.refreshState.set({})
    }

    private _from?: string | MeshManager
    public get from() {
        return this._from
    }
    public set from(val) {
        this._from = val
        this.refreshState.set({})
    }

    private manualPosition?: boolean
    private setManualPosition() {
        this.manualPosition = true
        this.refreshState.set({})
    }

    public override get x() {
        return super.x
    }
    public override set x(val) {
        super.x = val
        this.setManualPosition()
    }

    public override get y() {
        return super.y
    }
    public override set y(val) {
        super.y = val
        this.setManualPosition()
    }

    public override get z() {
        return super.z
    }
    public override set z(val) {
        super.z = val
        this.setManualPosition()
    }
}
