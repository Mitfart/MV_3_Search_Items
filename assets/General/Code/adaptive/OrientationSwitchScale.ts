import { _decorator, CCBoolean, CCFloat, Node, Vec3} from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchScale')
export class OrientationSwitchScale extends OrientationSwitch {
    @property(CCFloat) hor_scale: number = 1;
    @property(CCFloat) ver_scale: number = 1;
    
    private get _Ver(): Vec3 { return new Vec3(this.ver_scale, this.ver_scale, this.ver_scale) }
    private get _Hor(): Vec3 { return new Vec3(this.hor_scale, this.hor_scale, this.hor_scale) }


    protected override applyOrientation(isPortrait: boolean): void {
        this.node.setScale(isPortrait ? this._Ver : this._Hor);
    }
}