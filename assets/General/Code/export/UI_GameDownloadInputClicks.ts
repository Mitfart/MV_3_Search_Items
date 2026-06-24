import { _decorator, CCInteger, Component, input, Input } from 'cc';
import super_html_playable from './super_html_playable';
import { PlayableEvents } from 'db://assets/Scripts/PlayableEvents';

const { ccclass, property } = _decorator;

declare global {
    interface Window {
        CLICKS_TO_DOWNLOAD?: number;
    }
}

@ccclass('UI_GameDownloadInputClicks')
export class UI_GameDownloadInputClicks extends Component
{
    @property({
        type: CCInteger,
        tooltip: 'Downloads the game after this many clicks/taps. 0 disables the trigger.',
    })
    clicksToDownload: number = 1;

    private _clicks: number = 0;


    private get clicksLimit(): number {
        return window.CLICKS_TO_DOWNLOAD ?? this.clicksToDownload;
    }

    protected onEnable(): void {
        input.on(Input.EventType.TOUCH_END, this.onInputClick, this);
    }

    protected onDisable(): void {
        input.off(Input.EventType.TOUCH_END, this.onInputClick, this);
    }

    private onInputClick(): void {
        const clicksToDownload = this.clicksLimit;
        if (clicksToDownload < 1) return;

        this._clicks++;
        if (this._clicks < clicksToDownload) return;

        super_html_playable.download();
    }
}
