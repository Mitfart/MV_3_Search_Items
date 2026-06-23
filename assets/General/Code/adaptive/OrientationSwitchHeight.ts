import { _decorator, CCFloat, UITransform, Widget, Layout } from 'cc';
import { OrientationSwitch } from './OrientationSwitch';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitchHeight')
export class OrientationSwitchHeight extends OrientationSwitch {
    @property(UITransform) transform: UITransform = null;
    @property(CCFloat) hor_height: number = 0;
    @property(CCFloat) ver_height: number = 0;
    

    protected override applyOrientation(isPortrait: boolean): void {
        if (!this.transform) {
            this.transform = this.getComponent(UITransform)!;
            if (!this.transform) return;
        }

        const size = this.transform.contentSize;
        size.set(size.width, isPortrait ? this.ver_height : this.hor_height);
        this.transform.contentSize = size;

        // Height change affects anchoring + container layout; force refresh now and next frame.
        const widget = this.getComponent(Widget);
        widget?.updateAlignment();

        const ownLayout = this.getComponent(Layout);
        ownLayout?.updateLayout(true);

        const parentLayout = this.node.parent?.getComponent(Layout);
        if (parentLayout) {
            parentLayout.updateLayout(true);
            this.scheduleOnce(() => parentLayout.updateLayout(true), 0);
        }

        if (widget) {
            this.scheduleOnce(() => widget.updateAlignment(), 0);
        }
    }
}