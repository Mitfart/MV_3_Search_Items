import { _decorator, AnimationComponent} from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchAnimation')
export class OrientationSwitchAnimation extends OrientationSwitch {
    @property(AnimationComponent) anim_ver: AnimationComponent = null;
    @property(AnimationComponent) anim_hor: AnimationComponent = null;
    

    protected override applyOrientation(isPortrait: boolean): void {
        if (isPortrait) {
            this.anim_ver.play();
            this.anim_hor.stop();
        } else {
            this.anim_ver.stop();
            this.anim_hor.play();
        }
    }
}