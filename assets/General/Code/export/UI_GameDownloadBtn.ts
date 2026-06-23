import { _decorator, Button, Component } from 'cc';
import super_html_playable from './super_html_playable';
const { ccclass, requireComponent } = _decorator;


@ccclass('UI_GameDownloadBtn')
export class UI_GameDownloadBtn extends Component 
{
    private _btns: Button[] = [];
    
    protected onLoad(): void {
        this._btns = this.getComponentsInChildren(Button) || [this.getComponent(Button)];
        this._btns.forEach(btn => btn.node.on(Button.EventType.CLICK, () => { super_html_playable.download(); }, this));
    }
}


