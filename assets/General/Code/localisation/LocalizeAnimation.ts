import { _decorator, AnimationClip, AnimationComponent, warn } from 'cc';
import { Localize } from './Localize';
const { ccclass, property, requireComponent } = _decorator;

@ccclass("LocalizeAnimation")
@requireComponent(AnimationComponent)
export class LocalizeAnimation extends Localize {
    @property(AnimationClip) RU: AnimationClip = null;
    @property(AnimationClip) NL: AnimationClip = null;
    @property(AnimationClip) CH: AnimationClip = null;
    @property(AnimationClip) ES: AnimationClip = null;
    @property(AnimationClip) BE: AnimationClip = null;
    @property(AnimationClip) DE: AnimationClip = null;


    protected set(data: string): void {
        const clip = this.getClip(data);
        const animation = this.getComponent(AnimationComponent);
        if (clip && animation) {
            animation.play(clip.name);
        } else {
            warn(`Incorrect code: "${data}"`);
        }
    }

    private getClip(code: string): AnimationClip | null {
        switch (code?.toUpperCase()) {
            case 'RU': return this.RU;
            case 'NL': return this.NL;
            case 'CH': return this.CH;
            case 'ES': return this.ES;
            case 'BE': return this.BE;
            case 'DE': return this.DE;
            default: return null;
        }
    }
}
