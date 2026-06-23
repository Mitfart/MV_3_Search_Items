import { _decorator, CCBoolean, CCInteger, log, Node, Vec3, view } from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationScaleToFitView')
export class OrientationScaleToFitView extends OrientationSwitch {
    @property(Node) target: Node = null;
    @property(CCInteger) width: number;
    @property(CCBoolean) portaitFirst: boolean = true;

    private _initScale: Vec3 = new Vec3;


    protected onLoad(): void {
        if (!this.target)
            log(`No "target" on "${this.node.name}"`)

        this._initScale.set(this.target.scale);

        super.onLoad();
    }

    protected applyOrientation(isPortrait: boolean): void {
        if (this.portaitFirst && isPortrait) {
            this.target.setScale(this._initScale);
        } else {
            const v = view.getVisibleSize();
            const k = v.width / this.width;

            this.target.setScale(
                this._initScale
                    .clone()
                    .multiply3f(k, k, 1)
            );
        }
    }
}