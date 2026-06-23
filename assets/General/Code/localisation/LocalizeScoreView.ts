import { _decorator, Enum } from 'cc';
import { Localize } from './Localize';
import { UI_ScoreLabel } from '../score/UI_ScoreView';
const { ccclass, property } = _decorator;

export enum ScoreParam {
    prefix = 1,
    postfix = 2,
}

@ccclass("LocalizeScoreView")
export class LocalizeScoreView extends Localize {
    @property({type: Enum(ScoreParam)}) scoreParam: ScoreParam = ScoreParam.prefix;
    

    protected set(txt: string): void {
        const scoreView = this.getComponent(UI_ScoreLabel);

        switch(this.scoreParam) {
            case ScoreParam.prefix: scoreView.prefix = txt; break;
            case ScoreParam.postfix: scoreView.postfix = txt; break;
        }
    }
}