import store, { createEffect } from "@lincode/reactivity"
import { PCFSoftShadowMap, WebGLRenderer } from "three"
import { getBackgroundColor } from "./useBackgroundColor"
import { rendererPtr } from "../pointers/rendererPtr"

const [setRenderer, getRenderer] = store<WebGLRenderer | undefined>(undefined)
export { getRenderer }

createEffect(() => {
    const renderer = new WebGLRenderer({
        powerPreference: "high-performance",
        alpha: getBackgroundColor() === "transparent"
    })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    setRenderer(renderer)
    rendererPtr[0] = renderer

    return () => {
        renderer.dispose()
    }
}, [getBackgroundColor])
