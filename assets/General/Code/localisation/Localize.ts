import { _decorator, Component, Enum, Label, log } from 'cc';
import { LandDataParam, LangData, Localization as Localization } from './Localization';
const { property } = _decorator;

export abstract class Localize extends Component {
    @property({type: Enum(LandDataParam)}) param: LandDataParam;


    protected start(): void {
        this.set(Localization.get(this.param));
    }


    protected abstract set(txt: string): void;
}