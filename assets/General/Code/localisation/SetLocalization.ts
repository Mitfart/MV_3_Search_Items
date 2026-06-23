import { _decorator, Component, AudioSource, CCFloat, Prefab, Enum } from 'cc';
import { LangCode, Localization } from './Localization';

const { ccclass, property } = _decorator;

@ccclass('SetLocalization')
export class SetLocalization extends Component {
    @property({type: Enum(LangCode)}) private lang: LangCode;

    protected onLoad(): void {
        Localization.setLanguage(this.lang);
    }
}