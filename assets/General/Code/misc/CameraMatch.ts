import { _decorator, Camera, CCBoolean, Component, gfx } from 'cc';

const { ccclass, property, requireComponent } = _decorator;

@ccclass('CameraMatch')
@requireComponent(Camera)
export class CameraMatch extends Component {
    @property(Camera)
    targetCamera: Camera = null!;

    @property({
        type: CCBoolean,
        tooltip:
            'Clear only depth/stencil before this camera draws (not color). Use when this camera renders after the main camera so layered meshes are not depth-tested against the main pass (coins/VFX on top).',
    })
    overlayDepthOnlyClear: boolean = false;

    private _camera: Camera = null!;

    protected onLoad(): void {
        this._camera = this.getComponent(Camera)!;
        if (this.overlayDepthOnlyClear) {
            this._camera.clearFlags = gfx.ClearFlagBit.DEPTH_STENCIL;
        }
    }

    protected lateUpdate(): void {
        if (!this.targetCamera || !this._camera) {
            return;
        }

        const tNode = this.targetCamera.node;
        this.node.setWorldPosition(tNode.worldPosition);
        this.node.setWorldRotation(tNode.worldRotation);
        this.node.setWorldScale(tNode.worldScale);

        const src = this.targetCamera;
        const dst = this._camera;

        dst.projection = src.projection;
        dst.orthoHeight = src.orthoHeight;
        dst.fov = src.fov;
        dst.near = src.near;
        dst.far = src.far;
    }
}
