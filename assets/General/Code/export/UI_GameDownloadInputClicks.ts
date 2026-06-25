import { _decorator, Node, CCInteger, Component, input, Input } from 'cc';
import { UI_GameDownloadBtn } from './UI_GameDownloadBtn';

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

    @property(UI_GameDownloadBtn)
    downloadButton: UI_GameDownloadBtn | null = null;

    private _clicks: number = 0;

    public get clicksLimit(): number {
        return window.CLICKS_TO_DOWNLOAD ?? this.clicksToDownload;
    }
    

    public init(): void {
        this.updateState();
        
    }

    public registerInteraction(): void {
        this._clicks++;
        this.updateState();
    }


    private updateState(): void {
        this.downloadButton.node.active = this.clicksLimit <= 0 
            ? false 
            : this._clicks >= this.clicksLimit - 1;
    }
}
