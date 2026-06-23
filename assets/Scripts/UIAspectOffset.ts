import { _decorator, Component, Node, Vec3, view, Widget } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('UIAspectOffset')
export class UIAspectOffset extends Component {
    @property({ tooltip: 'Apply offset when visible width:height matches this ratio.' })
    public aspectWidth = 9;

    @property({ tooltip: 'Apply offset when visible width:height matches this ratio.' })
    public aspectHeight = 16;

    @property({ tooltip: 'Allowed aspect ratio difference.' })
    public tolerance = 0.02;

    @property({ tooltip: 'Vertical offset in pixels for the matching aspect.' })
    public offsetY = 100;

    private basePosition = new Vec3();
    private baseWidgetTop = 0;
    private baseWidgetBottom = 0;
    private widget: Widget | null = null;
    private applied = false;

    protected onLoad(): void {
        this.basePosition = this.node.position.clone();
        this.widget = this.node.getComponent(Widget);
        if (this.widget) {
            this.baseWidgetTop = this.widget.top;
            this.baseWidgetBottom = this.widget.bottom;
        }
        this.apply();
    }

    protected update(): void {
        this.apply();
    }

    private apply(): void {
        const shouldApply = this.isMatchingAspect();
        if (shouldApply === this.applied) return;
        this.applied = shouldApply;

        if (this.widget?.isAlignBottom) {
            this.widget.bottom = this.baseWidgetBottom + (shouldApply ? this.offsetY : 0);
            this.widget.updateAlignment();
            return;
        }

        if (this.widget?.isAlignTop) {
            this.widget.top = this.baseWidgetTop - (shouldApply ? this.offsetY : 0);
            this.widget.updateAlignment();
            return;
        }

        this.node.setPosition(this.basePosition.x, this.basePosition.y + (shouldApply ? this.offsetY : 0), this.basePosition.z);
    }

    private isMatchingAspect(): boolean {
        const size = view.getVisibleSize();
        if (size.height <= 0 || this.aspectHeight <= 0) return false;
        return Math.abs(size.width / size.height - this.aspectWidth / this.aspectHeight) <= this.tolerance;
    }
}
