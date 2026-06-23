import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('GameSheduler')
export class GameSheduler extends Component {
    private static _i: GameSheduler;
    public static get I(): Component { return this._i; }


    protected onLoad(): void {
        if (!GameSheduler._i)
            GameSheduler._i = this;
        else
            this.node.destroy();
    }
}