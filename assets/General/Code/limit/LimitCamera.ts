import { _decorator, log, screen, UITransform, Vec2, view} from 'cc';
import { LimitPosition2D } from './LimitPosition2D';
import { OrientationSwitch } from '../adaptive/OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('LimitCamera')
export class LimitCamera extends OrientationSwitch {
    @property(UITransform) level: UITransform = null;
    
    private _limit: LimitPosition2D = null;


    protected onLoad(): void {
        this._limit = this.node.addComponent(LimitPosition2D);
        this._limit.worldSpace = true;
        this._limit.setMinLimits(Vec2.ZERO);

        super.onLoad();
    }

    protected applyOrientation(isPortrait: boolean): void {
        const v = view.getVisibleSize();
        this._limit.setSize2f(v.width, v.height);

        if (this.level && this.level.contentSize) {
            let width = this.level.contentSize.width * this.level.node.worldScale.x + this.level.node.worldPositionX;
            let height = this.level.contentSize.height * this.level.node.worldScale.y + this.level.node.worldPositionY;

            this._limit.setMaxLimits2f(
                Math.max(v.width, width), 
                Math.max(v.height, height), 
            );
        } else {
            this._limit.setMaxLimits2f(
                v.width, 
                v.height, 
            );
        }
    }
}