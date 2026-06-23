import { _decorator, CCInteger, log, Node, Vec3, view } from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationMaxWidth')
export class OrientationMaxWidth extends OrientationSwitch {
    @property(CCInteger) width: number;

    private _initScale: Vec3 = new Vec3;


    protected onLoad(): void {
        this._initScale.set(this.node.scale);

        super.onLoad();
    }

    protected applyOrientation(isPortrait: boolean): void {
        const v = view.getVisibleSize();

        if (v.width >= this.width) {
            this.node.setScale(this._initScale);
        } else {
            const k = v.width / this.width;

            this.node.setScale(
                this._initScale
                    .clone()
                    .multiply3f(k, k, 1)
            );
        }

    }
}