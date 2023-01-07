import { deg2Rad, rad2Deg } from "@lincode/math"
import { Reactive } from "@lincode/reactivity"
import {
    MeshStandardMaterial,
    SpriteMaterial,
    VideoTexture,
    RepeatWrapping,
    Vector2,
    Texture
} from "three"
import Appendable from "../../api/core/Appendable"
import {
    hiddenAppendables,
    nonSerializedAppendables
} from "../../api/core/collections"
import IBasicMaterialManager, {
    basicMaterialManagerDefaults,
    basicMaterialManagerSchema
} from "../../interface/IBasicMaterialManager"
import getPrivateValue from "../../utils/getPrivateValue"
import debounceSystem from "../../utils/debounceSystem"
import loadTexture from "../utils/loaders/loadTexture"

const mapNames = ["map", "alphaMap"]
const applyTextureSystem = debounceSystem(
    (target: BasicMaterialManager<any>, mapNames: Array<string>) => {
        const repeat = getPrivateValue(target, "_textureRepeat")
        const flipY = getPrivateValue(target, "_textureFlipY")
        const rotation = getPrivateValue(target, "_textureRotation")
        for (const name of mapNames) {
            const map: Texture = target.nativeMaterial[name]
            if (!map) return
            repeat !== undefined && (map.repeat = repeat)
            rotation !== undefined && (map.rotation = rotation * deg2Rad)
            if (flipY !== undefined && flipY !== map.flipY) {
                map.flipY = flipY
                map.needsUpdate = true
            }
        }
    }
)

export default class BasicMaterialManager<
        T extends MeshStandardMaterial | SpriteMaterial
    >
    extends Appendable
    implements IBasicMaterialManager
{
    public static componentName = "basicMaterial"
    public static defaults = basicMaterialManagerDefaults
    public static schema = basicMaterialManagerSchema

    public constructor(public nativeMaterial: T) {
        super()
        nonSerializedAppendables.add(this)
        hiddenAppendables.add(this)
    }

    public override dispose() {
        if (this.done) return this
        super.dispose()
        this.nativeMaterial.dispose()
        return this
    }

    public get color() {
        return "#" + this.nativeMaterial.color.getHexString()
    }
    public set color(val) {
        this.nativeMaterial.color.set(val)
    }

    public get opacity() {
        return this.nativeMaterial.opacity
    }
    public set opacity(val) {
        this.nativeMaterial.opacity = val
        this.nativeMaterial.transparent = val <= 1
        this.nativeMaterial.needsUpdate = true
    }

    protected applyTexture(mapNames: Array<string>) {
        applyTextureSystem(this, mapNames)
        this.nativeMaterial.needsUpdate = true
    }

    private videoTextureState?: Reactive<string | HTMLVideoElement | undefined>
    private textureState?: Reactive<string | undefined>

    private initTexture() {
        if (this.textureState) return

        const videoTextureState = (this.videoTextureState = new Reactive<
            string | HTMLVideoElement | undefined
        >(undefined))
        const textureState = (this.textureState = new Reactive<
            string | undefined
        >(undefined))

        this.createEffect(() => {
            const url = textureState.get()
            const videoURL = videoTextureState.get()

            if (videoURL) {
                let video: HTMLVideoElement
                if (typeof videoURL === "string") {
                    video = document.createElement("video")
                    video.crossOrigin = "anonymous"
                    video.src = videoURL
                    video.loop = true
                    video.autoplay = true
                    video.muted = true
                    video.playsInline = true
                    video.play()
                } else video = videoURL

                const videoTexture = new VideoTexture(
                    video,
                    undefined,
                    RepeatWrapping,
                    RepeatWrapping
                )

                const { nativeMaterial } = this
                const { map } = nativeMaterial
                nativeMaterial.map = videoTexture
                this.applyTexture(mapNames)

                return () => {
                    video.pause()
                    videoTexture.dispose()
                    nativeMaterial.map = map
                }
            }

            if (!url) return

            const { nativeMaterial } = this
            const { map } = nativeMaterial
            nativeMaterial.map = loadTexture(url)
            this.applyTexture(mapNames)

            return () => {
                nativeMaterial.map = map
            }
        }, [videoTextureState.get, textureState.get])
    }

    public get videoTexture() {
        return this.videoTextureState?.get()
    }
    public set videoTexture(url) {
        this.initTexture()
        this.videoTextureState!.set(url)
    }

    public get texture() {
        return this.textureState?.get()
    }
    public set texture(url) {
        this.initTexture()
        this.textureState!.set(url)
    }

    private _alphaMap?: string
    public get alphaMap() {
        return this._alphaMap
    }
    public set alphaMap(val) {
        this._alphaMap = val
        this.nativeMaterial.alphaMap = val ? loadTexture(val) : null
        this.applyTexture(mapNames)
    }

    protected _textureRepeat?: Vector2
    public get textureRepeat() {
        return this.nativeMaterial.map?.repeat ?? this._textureRepeat
    }
    public set textureRepeat(val: Vector2 | number | undefined) {
        typeof val === "number" && (val = new Vector2(val, val))
        this._textureRepeat = val
        this.applyTexture(mapNames)
    }

    protected _textureFlipY?: boolean
    public get textureFlipY() {
        return this.nativeMaterial.map?.flipY ?? this._textureFlipY
    }
    public set textureFlipY(val) {
        this._textureFlipY = val
        this.applyTexture(mapNames)
    }

    protected _textureRotation?: number
    public get textureRotation() {
        return this.nativeMaterial.map
            ? this.nativeMaterial.map.rotation * rad2Deg
            : this._textureRotation
    }
    public set textureRotation(val) {
        this._textureRotation = val
        this.applyTexture(mapNames)
    }
}
