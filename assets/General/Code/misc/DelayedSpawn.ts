import { _decorator, CCFloat, Prefab, Node, instantiate, Vec3 } from 'cc';
import { GameSheduler } from './GameSheduler';

const { ccclass, property } = _decorator;

@ccclass('DelayedSpawn')
export class DelayedSpawn {
    @property(CCFloat) private delay: number = 1;
    @property(Prefab) private prefab: Prefab = null;

    public get Delay() : number { return this.delay; }
    public get Prefab() : Prefab { return this.prefab; }
    

    public spawn(parent: Node, onComplete: () => void = null) {
        GameSheduler.I.scheduleOnce(() => {
            const ins = instantiate(this.prefab);
            ins.setParent(parent);

            if (onComplete) onComplete();
        }, this.delay);
    }
}