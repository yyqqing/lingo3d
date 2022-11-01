import PhysicsObjectManager from "../.."
import getActualScale from "../../../../utils/getActualScale"

export default async function (this: PhysicsObjectManager) {
    const { Sphere } = await import("cannon-es")

    const shape = new Sphere(getActualScale(this).x * 0.5)
    this.cannonBody!.addShape(shape)
}
