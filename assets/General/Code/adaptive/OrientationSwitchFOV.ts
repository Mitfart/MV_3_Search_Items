import { _decorator, Camera, CCInteger, log, Node, Vec3, view } from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchFOV')
export class OrientationSwitchFOV extends OrientationSwitch {
    @property(Camera) target: Camera = null;
    @property(CCInteger) verFOV: number;
    @property(CCInteger) horFOV: number;


    protected applyOrientation(isPortrait: boolean): void {
        this.target.fov = isPortrait ? this.verFOV : this.horFOV;
    }
}