import { lazy } from "@lincode/utils"
import { selectionCandidates } from "../collections/selectionCandidates"
import MeshAppendable from "../display/core/MeshAppendable"
import { point2Vec, vec2Point } from "../display/utils/vec2Point"
import { TransformControls } from "../engine/transformControls/TransformControls"
import { raycast } from "../memo/raycast"
import { editorPlanePtr } from "../pointers/editorPlanePtr"
import { selectionTargetPtr } from "../pointers/selectionTargetPtr"
import { Point3dType } from "../utils/isPoint"
import createInternalSystem from "./utils/createInternalSystem"
import { Object3D } from "three"

const lazySnapObjects = lazy(() => {
    const snapObjects: Array<Object3D> = []
    for (const x of [-0.5, 0, 0.5])
        for (const y of [-0.5, 0, 0.5])
            for (const z of [-0.5, 0, 0.5]) {
                const snapObject = new Object3D()
                snapObject.position.set(x, y, z)
                snapObjects.push(snapObject)
            }
    return snapObjects
})

const trySnap = (self: TransformControls, direction: Point3dType) => {
    const selectionTarget = selectionTargetPtr[0] as MeshAppendable

    const result = raycast(
        selectionCandidates,
        {
            //@ts-ignore
            origin: vec2Point(self.worldPosition),
            direction: direction,
            include: self.axis === "Y" ? editorPlanePtr[0] : undefined,
            exclude: selectionTarget
        },
        true
    )
    if (!result) return
    const dist = selectionTarget.position.distanceTo(point2Vec(result.point))
    if (dist > 0.7) return
    selectionTarget.position.copy(point2Vec(result.point))
}

export const snapRaycastSystem = createInternalSystem("snapRaycastSystem", {
    data: {} as { direction0: Point3dType; direction1: Point3dType },
    update: (self: TransformControls, data) => {
        trySnap(self, data.direction0)
        trySnap(self, data.direction1)
    },
    effect: () => {
        const selectionTarget = selectionTargetPtr[0] as MeshAppendable
        for (const obj of lazySnapObjects()) selectionTarget.object3d.add(obj)
    },
    cleanup: () => {
        const selectionTarget = selectionTargetPtr[0] as MeshAppendable
        for (const obj of lazySnapObjects())
            selectionTarget.object3d.remove(obj)
    }
})
