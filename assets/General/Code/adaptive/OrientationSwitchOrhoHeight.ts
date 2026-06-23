import { _decorator, Camera, CCFloat, CCInteger, log, Node, Vec3, view } from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchOrhoHeight')
export class OrientationSwitchOrhoHeight extends OrientationSwitch {
    @property(Camera) target: Camera = null;
    @property(CCFloat) verHeight: number;
    @property(CCFloat) horHeight: number;


    protected applyOrientation(isPortrait: boolean): void {
        this.target.orthoHeight = isPortrait ? this.verHeight : this.horHeight;
    }
}