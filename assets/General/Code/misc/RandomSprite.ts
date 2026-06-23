import { _decorator, Component, randomRangeInt, SpriteComponent } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('RandomSprite')
export class RandomSprite extends Component {
    @property(SpriteComponent) renderer: SpriteComponent = null;
    @property([SpriteComponent]) sprites: SpriteComponent[] = [];


    protected onLoad(): void {
        const source = this.sprites[randomRangeInt(0, this.sprites.length)];
        if (source?.spriteFrame) this.renderer.spriteFrame = source.spriteFrame;
    }
}
