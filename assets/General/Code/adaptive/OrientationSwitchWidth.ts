import { _decorator, CCFloat, UITransform} from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchWidth')
export class OrientationSwitchWidth extends OrientationSwitch {
    @property(UITransform) transform: UITransform = null;
    @property(CCFloat) hor_width: number = 0;
    @property(CCFloat) ver_width: number = 0;
    

    protected override applyOrientation(isPortrait: boolean): void {
        const size = this.transform.contentSize;
        size.set(isPortrait ? this.ver_width : this.hor_width, size.height);
        this.transform.contentSize = size; 
    }
}