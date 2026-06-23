import { _decorator, Vec3} from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
import { Follow2D } from '../movement/Follow2D';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchFollowOffset')
export class OrientationSwitchFollowOffset extends OrientationSwitch {
    @property(Follow2D) target: Follow2D = null;
    @property(Vec3) hor_offset: Vec3 = new Vec3;
    @property(Vec3) ver_offset: Vec3 = new Vec3;
    

    protected override applyOrientation(isPortrait: boolean): void {
        this.target.offset = isPortrait ? this.ver_offset : this.hor_offset;
    }
}