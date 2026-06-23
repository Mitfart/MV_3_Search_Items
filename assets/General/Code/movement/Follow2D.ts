import { _decorator, Node, Component, CCFloat, Vec3, CCBoolean } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Follow2D')
export class Follow2D extends Component {
    @property(Node) private target: Node;
    @property(Vec3) offset: Vec3 = new Vec3;

    @property(CCBoolean) smoothFollow: boolean = true;
    @property({ type: CCFloat, visible() { return this.smoothFollow }, }) followSpeed = 5;

    private _targetPos: Vec3 = new Vec3;
    private _pos: Vec3 = new Vec3;


    protected start(): void {
        this.setTarget(this.target);
    }


    public setTarget(newTarget: Node, wPos: Vec3 = null) {
        this._targetPos = newTarget 
            ? newTarget.worldPosition.clone() 
            : wPos 
                ? wPos 
                : this.target 
                    ? this.target.worldPosition.clone()
                    : this.node.worldPosition;
        this._pos = this._targetPos.clone().add(this.offset);

        this.node.setWorldPosition(this._pos);
        
        this.target = newTarget;
    }


    protected lateUpdate(dt: number): void {
        if (this.target && this.target.isValid) {
            this.target.getWorldPosition(this._targetPos);
            this._targetPos.add(this.offset);
        }
        
        if (!this.smoothFollow) {
            this._pos = this._targetPos;
        } else {
            this.node.getWorldPosition(this._pos);

            Vec3.moveTowards(this._pos, this._pos, this._targetPos, this.followSpeed * dt);
        }
        
        this.node.setWorldPosition(this._pos);
    }
}