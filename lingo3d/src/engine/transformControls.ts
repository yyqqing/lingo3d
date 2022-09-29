import { createEffect } from "@lincode/reactivity"
import { emitTransformControls } from "../events/onTransformControls"
import { getSelectionTarget } from "../states/useSelectionTarget"
import { getTransformControlsSnap } from "../states/useTransformControlsSnap"
import { container } from "./renderLoop/renderSetup"
import scene from "./scene"
import { lazy } from "@lincode/utils"
import { Cancellable } from "@lincode/promiselikes"
import { setTransformControlsDragging } from "../states/useTransformControlsDragging"
import { getEditorModeComputed } from "../states/useEditorModeComputed"
import { getTransformControlsSpaceComputed } from "../states/useTransformControlsSpaceComputed"
import { getCameraRendered } from "../states/useCameraRendered"
import { getSelectionNativeTarget } from "../states/useSelectionNativeTarget"
import { onBeforeRenderSSR } from "../events/onBeforeRenderSSR"
import { onAfterRenderSSR } from "../events/onAfterRenderSSR"

const lazyTransformControls = lazy(async () => {
    const { TransformControls } = await import(
        "three/examples/jsm/controls/TransformControls"
    )

    const transformControls = new TransformControls(
        getCameraRendered(),
        container
    )
    getCameraRendered((camera) => (transformControls.camera = camera))
    transformControls.enabled = false

    let dragging = false

    transformControls.addEventListener("dragging-changed", ({ value }) => {
        dragging = value
        setTransformControlsDragging(dragging)
        emitTransformControls(dragging ? "start" : "stop")
    })

    transformControls.addEventListener(
        "change",
        () => dragging && emitTransformControls("move")
    )

    return transformControls
})

createEffect(() => {
    const target =
        getSelectionNativeTarget() ?? getSelectionTarget()?.outerObject3d
    if (!target) return

    let mode = getEditorModeComputed()
    if (mode === "path") mode = "translate"

    const space = getTransformControlsSpaceComputed()
    const snap = getTransformControlsSnap()

    const handle = new Cancellable()

    lazyTransformControls().then((transformControls) => {
        if (
            handle.done ||
            !target.parent ||
            (mode !== "translate" && mode !== "rotate" && mode !== "scale")
        )
            return

        transformControls.setMode(mode)
        transformControls.setSpace(space)
        transformControls.setScaleSnap(snap)
        transformControls.setRotationSnap(snap)
        transformControls.setTranslationSnap(snap)

        scene.add(transformControls)
        transformControls.attach(target)
        transformControls.enabled = true

        const handle1 = onBeforeRenderSSR(() => {
            transformControls.visible = false
        })
        const handle2 = onAfterRenderSSR(() => {
            transformControls.visible = true
        })
        handle.then(() => {
            scene.remove(transformControls)
            transformControls.detach()
            transformControls.enabled = false
            handle1.cancel()
            handle2.cancel()
        })
    })
    return () => {
        handle.cancel()
    }
}, [
    getSelectionTarget,
    getSelectionNativeTarget,
    getEditorModeComputed,
    getTransformControlsSpaceComputed,
    getTransformControlsSnap
])
