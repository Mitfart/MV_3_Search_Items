import { _decorator, Component, CCFloat, tween, Button, AnimationComponent, UIOpacity, Node, Vec3, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tutorial_Btn')
export class Tutorial_Btn extends Component {
    private static DELTA_TIME: number = .1;

    @property(Button) targetBtn: Button = null;
    @property(UIOpacity) opacity: UIOpacity = null;
    @property(AnimationComponent) tuttorialAnim: AnimationComponent = null;
    @property(CCFloat) delayBeforePlay: number = .5;
    @property(CCFloat) delayBeforeReplay: number = 5;
    @property(CCFloat) showHideDuration: number = .25;
    @property(Node) bounceTarget: Node = null;
    @property(CCFloat) bounceScaleMultiplier: number = 1.1;
    @property(CCFloat) bounceDuration: number = .45;
    @property(CCFloat) minTransparency: number = 96;
    @property(CCFloat) maxTransparency: number = 160;

    private _timeToShow: number = 0;
    private _baseBounceScale: Vec3 = new Vec3();
    private _showing: boolean = false;


    protected onLoad(): void {
        this.targetBtn.node.on(Button.EventType.CLICK, this.stopTuttorial, this);
        
        this._timeToShow = this.delayBeforePlay;
        this.schedule(() => {
            if (this._showing || !this.targetBtn.interactable)
                return;
            
            this._timeToShow -= Tutorial_Btn.DELTA_TIME;
            if (this._timeToShow <= 0) 
                this.show(); 
        }, Tutorial_Btn.DELTA_TIME);
    }
    
    public show() {
        tween(this.opacity)
            .call(() => {
                this._showing = true;
                this.tuttorialAnim.play();
                this.startBounce();
            })
            .start();
    }
    
    public hide(instantly: boolean = false) {
        if (!instantly) {
            tween(this.opacity)
                .to(this.showHideDuration, { opacity: 0 })
                .call(() => { 
                    this.tuttorialAnim.stop();
                    this.stopBounce();
                    this._showing = false;
                })
                .start();
        } else {
            this.opacity.opacity = 0;
            this.tuttorialAnim.stop();
            this.stopBounce();
            this._showing = false;
        }
    }

    public stopTuttorial() {
        this.hide();
        this._timeToShow = this.delayBeforeReplay;
    }

    private startBounce() {
        const target = this.bounceTarget || this.node;
        if (!target) return;

        this._baseBounceScale.set(target.scale);
        Tween.stopAllByTarget(target);
        Tween.stopAllByTarget(this.opacity);
        this.opacity.opacity = this.minTransparency;

        tween(target)
            .to(this.bounceDuration, { scale: this._baseBounceScale.clone().multiplyScalar(this.bounceScaleMultiplier) }, { easing: 'sineOut' })
            .to(this.bounceDuration, { scale: this._baseBounceScale }, { easing: 'sineIn' })
            .union()
            .repeatForever()
            .start();

        tween(this.opacity)
            .to(this.bounceDuration, { opacity: this.maxTransparency }, { easing: 'sineOut' })
            .to(this.bounceDuration, { opacity: this.minTransparency }, { easing: 'sineIn' })
            .union()
            .repeatForever()
            .start();
    }

    private stopBounce() {
        const target = this.bounceTarget || this.node;
        if (target) {
            Tween.stopAllByTarget(target);
            if (this._baseBounceScale.lengthSqr() > 0) target.setScale(this._baseBounceScale);
        }
        Tween.stopAllByTarget(this.opacity);
    }
}