import { _decorator, CCString, Label, log } from 'cc';
import { Localize } from './Localize';
const { ccclass, property, requireComponent } = _decorator;

@ccclass("LocalizeLabel")
@requireComponent(Label)
export class LocalizeLabel extends Localize {
    @property(CCString) prefix: string = "";
    @property(CCString) postfix: string = "";

    protected set(txt: string): void {
        this.getComponent(Label).string = `${this.prefix}${txt}${this.postfix}`;
    }
}