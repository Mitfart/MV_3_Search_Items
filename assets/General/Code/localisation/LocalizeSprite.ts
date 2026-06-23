import { _decorator, SpriteComponent } from 'cc';
import { Localize } from './Localize';
const { ccclass, property, requireComponent } = _decorator;

@ccclass("LocalizeSprite")
@requireComponent(SpriteComponent)
export class LocalizeSprite extends Localize {
    @property(SpriteComponent) EN: SpriteComponent = null;
    @property(SpriteComponent) ES: SpriteComponent = null;
    @property(SpriteComponent) FR: SpriteComponent = null;
    @property(SpriteComponent) IT: SpriteComponent = null;
    @property(SpriteComponent) NL: SpriteComponent = null;
    @property(SpriteComponent) DE: SpriteComponent = null;

    protected set(data: string): void {
        const sprite = this.getComponent(SpriteComponent);
        const source = this.getSource(data);
        if (sprite && source?.spriteFrame) sprite.spriteFrame = source.spriteFrame;
    }

    private getSource(code: string): SpriteComponent | null {
        switch (code?.toUpperCase()) {
            case 'ES': return this.ES || this.EN;
            case 'FR': return this.FR || this.EN;
            case 'IT': return this.IT || this.EN;
            case 'NL': return this.NL || this.EN;
            case 'DE': return this.DE || this.EN;
            case 'EN':
            default:
                return this.EN;
        }
    }
}
