import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('GameSheduler')
export class GameSheduler extends Component {
    private static instance: GameSheduler | null = null;

    public static get I(): GameSheduler | null {
        return this.instance;
    }

    protected onLoad(): void {
        if (GameSheduler.instance) {
            this.node.destroy();
            return;
        }

        GameSheduler.instance = this;
    }

    protected onDestroy(): void {
        if (GameSheduler.instance === this) GameSheduler.instance = null;
    }
}