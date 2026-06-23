import { _decorator, CCBoolean, Component, log, math, Vec2, Vec3} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LimitPosition2D')
export class LimitPosition2D extends Component {
    @property({type: Vec2, visible: true}) private _size: Vec2 = new Vec2;

    @property({type: Vec2, visible: true}) private _minLimits: Vec2 = new Vec2;
    @property({type: Vec2, visible: true}) private _maxLimits: Vec2 = new Vec2;
    @property(CCBoolean) worldSpace: boolean;

    private _halfSize: Vec2 = new Vec2;
    private _trueMinLimits: Vec2 = new Vec2;
    private _trueMaxLimits: Vec2 = new Vec2;

    private _pos: Vec3 = new Vec3();


    protected onLoad(): void {
        this.calcTrueLimits();
    }

    protected lateUpdate(): void {
        if (this.worldSpace) 
            this.node.getWorldPosition(this._pos); 
        else 
            this.node.getPosition(this._pos); 
        
        if (this._trueMinLimits.x > this._trueMaxLimits.x) {
            this._pos.x = (this._trueMinLimits.x + this._trueMaxLimits.x) * .5;
        } else {
            this._pos.x = math.clamp(this._pos.x, this._trueMinLimits.x, this._trueMaxLimits.x);
        }

        if (this._trueMinLimits.y > this._trueMaxLimits.y) {
            this._pos.y = (this._trueMinLimits.y + this._trueMaxLimits.y) * .5;
        } else {
            this._pos.y = math.clamp(this._pos.y, this._trueMinLimits.y, this._trueMaxLimits.y);
        }
        
        
        if (this.worldSpace) 
            this.node.setWorldPosition(this._pos); 
        else 
            this.node.setPosition(this._pos); 
    }


    public getSize(): Vec2 { 
        return this._size; 
    }
    
    public setSize(value: Vec2) { 
        this._size.set(value);

        this.calcTrueLimits()
    }

    public setSize2f(x: number, y: number) { 
        this._size.x = x;
        this._size.y = y;
        
        this.calcTrueLimits()
    }

    
    public getMinLimits(): Vec2 { 
        return this._minLimits.clone(); 
    }
    
    public setMinLimits(value: Vec2) { 
        this._minLimits.set(value);

        this.calcTrueLimits()
    }

    public setMinLimits2f(x: number, y: number) { 
        this._minLimits.x = x;
        this._minLimits.y = y;
        
        this.calcTrueLimits()
    }
    
    
    public getMaxLimits(): Vec2 { 
        return this._maxLimits.clone(); 
    }
    
    public setMaxLimits(value: Vec2) { 
        this._maxLimits.set(value);

        this.calcTrueLimits()
    }

    public setMaxLimits2f(x: number, y: number) { 
        this._maxLimits.x = x;
        this._maxLimits.y = y;
        
        this.calcTrueLimits()
    }
    
    public setMaxLimitX(x: number) { 
        this._maxLimits.x = x;
        
        this.calcTrueLimits()
    }

    public setMaxLimitY(y: number) { 
        this._maxLimits.y = y;
        
        this.calcTrueLimits()
    }


    private calcTrueLimits() {
        this._halfSize = this._size.clone().divide2f(2, 2);
        
        this._trueMinLimits.x = this._minLimits.x + this._halfSize.x;
        this._trueMinLimits.y = this._minLimits.y + this._halfSize.y;

        this._trueMaxLimits.x = this._maxLimits.x - this._halfSize.x;
        this._trueMaxLimits.y = this._maxLimits.y - this._halfSize.y;
    }
}