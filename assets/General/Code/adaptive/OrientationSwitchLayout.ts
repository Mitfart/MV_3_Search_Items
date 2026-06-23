import { _decorator, Layout} from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchLayout')
export class OrientationSwitchLayout extends OrientationSwitch {
    @property(Layout) layout_ver: Layout = null;
    @property(Layout) layout_hor: Layout = null;
    

    protected override applyOrientation(isPortrait: boolean): void {
        this.layout_ver.enabled = isPortrait;
        this.layout_hor.enabled = !isPortrait;
    }
}