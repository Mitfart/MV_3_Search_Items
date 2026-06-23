import { _decorator, CCBoolean, Node, Vec3} from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchPosition')
export class OrientationSwitchPosition extends OrientationSwitch {
    @property(Node) target: Node = null;
    @property(Vec3) hor_pos: Vec3 = new Vec3;
    @property(Vec3) ver_pos: Vec3 = new Vec3;
    @property(CCBoolean) worldSpace: boolean = false;
    

    protected override applyOrientation(isPortrait: boolean): void {
        const pos = isPortrait ? this.ver_pos : this.hor_pos;

        if (this.worldSpace)
            this.node.setWorldPosition(pos);
        else
            this.node.setPosition(pos);
    }
}