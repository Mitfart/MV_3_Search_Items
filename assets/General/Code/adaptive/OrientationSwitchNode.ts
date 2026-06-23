import { _decorator, Node } from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchNode')
export class OrientationSwitchNode extends OrientationSwitch {
    @property(Node) verCanvas: Node = null;
    @property(Node) horCanvas: Node = null;
    

    protected override applyOrientation(isPortrait: boolean): void {
        this.verCanvas.active = isPortrait;
        this.horCanvas.active = !isPortrait;
    }
}