import { _decorator, Component, CCFloat, tween, easing, Vec3, Vec2, Node, CCBoolean, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UI_Screen')
export class UI_Screen extends Component {
    @property(Node) animView: Node = null;
    @property(CCFloat) animDuration: number = .5;
    @property(CCBoolean) hideOnAwake: boolean = false;
    @property(Vec2) animScales: Vec2 = new Vec2(0, 1);
    
    @property(CCBoolean) hideAfterShow: boolean = false;
    @property({type: CCFloat, visible() { return this.hideAfterShow; }}) showDuratuin: number = .25;

    @property(CCBoolean) tweenPos: boolean = false;
    @property({type: Vec3, visible() { return this.tweenPos; }}) showTargetPos: Vec3 = new Vec3;
    @property({type: Vec3, visible() { return this.tweenPos; }}) hideTargetPos: Vec3 = new Vec3;

    @property(CCBoolean) withBackground: boolean = false;
    @property({type: UIOpacity, visible() { return this.withBackground; }}) background: UIOpacity = null;
    @property({type: CCFloat, visible() { return this.withBackground; }}) backgroundOpacity: number = 255;

    private _initScale: Vec3 = new Vec3;
    private _minScale: Vec3 = new Vec3;
    private _maxScale: Vec3 = new Vec3;
    private _initPos: Vec3 = new Vec3;


    protected onLoad(): void {
        this._initScale.set(this.animView.scale);
        this._initPos.set(this.animView.position);

        this._minScale.set(this._initScale.clone().multiplyScalar(this.animScales.x));
        this._maxScale.set(this._initScale.clone().multiplyScalar(this.animScales.y));
    }

    protected start(): void {
        if (this.hideOnAwake) {
            this.hide(true);
        } else {
            this.hide(true);
            this.show();
        }
    }
    
    public show(onComplete: () => void = null) { 
        this.node.active = true;
        
        tween(this.animView)
            .set({ scale: this._minScale })
            .to(this.animDuration, { scale: this._maxScale }, { easing: easing.backOut })
            .call(onComplete)
            .delay(this.showDuratuin)
            .call(() => {
                if (this.hideAfterShow)
                    this.hide();
            })
            .start();
        
        if (this.tweenPos) {
            tween(this.animView)
                .set({ position: this._initPos })
                .to(this.animDuration, { position: this.showTargetPos}, { easing: easing.backOut })
                .start();
        }
        
        if (this.withBackground) {
            tween(this.background)
                .to(this.animDuration, { opacity: this.backgroundOpacity }, { easing: easing.backOut })
                .start();
        }
    }
    
    public hide(instantly: boolean = false) { 
        if (!instantly) {
            tween(this.animView)
                .set({ scale: this._maxScale })
                .to(this.animDuration, { scale: this._minScale }, { easing: easing.backIn })
                .start();
        
            if (this.tweenPos) {
                tween(this.animView)
                    .set({ position: this.showTargetPos })
                    .to(this.animDuration, { position: this.hideTargetPos }, { easing: easing.backIn })
                    .start();
            }
            
            if (this.withBackground) {
                tween(this.background)
                    .to(this.animDuration, { opacity: 0 }, { easing: easing.backIn })
                    .start();
            }
        } else {
            this.animView.setScale(this._minScale);
            
            if (this.tweenPos) this.animView.setPosition(this.hideTargetPos);
            if (this.withBackground) this.background.opacity = 0;
        }
    }
}