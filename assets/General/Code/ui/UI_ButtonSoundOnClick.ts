import { _decorator, Component, Button, AudioSource } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UI_ButtonSoundOnClick')
export class UI_ButtonSoundOnClick extends Component {
    @property(Button) button: Button = null;
    @property(AudioSource) audioSource: AudioSource = null;
        
    
    protected onLoad(): void {
        this.button.node.on(Button.EventType.CLICK, () => { this.audioSource.play(); }, this);
    }
}