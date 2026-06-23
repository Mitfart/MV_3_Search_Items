import { _decorator, CCInteger, Component } from 'cc';
import super_html_playable from './super_html_playable';

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

    private static readonly _instances: Set<UI_GameDownloadInputClicks> = new Set();

    private _clicks: number = 0;

    public static registerInputClick(): void {
        this._instances.forEach((instance) => instance.countInputClick());
    }

    public static getActiveClicksLimit(): number {
        const firstInstance = this._instances.values().next().value as UI_GameDownloadInputClicks | undefined;
        return window.CLICKS_TO_DOWNLOAD ?? firstInstance?.clicksToDownload ?? 1;
    }

    private get clicksLimit(): number {
        return UI_GameDownloadInputClicks.getActiveClicksLimit();
    }

    protected onEnable(): void {
        UI_GameDownloadInputClicks._instances.add(this);
    }

    protected onDisable(): void {
        UI_GameDownloadInputClicks._instances.delete(this);
    }

    private countInputClick(): void {
        const clicksToDownload = this.clicksLimit;
        if (clicksToDownload < 1) return;

        this._clicks++;
        if (this._clicks < clicksToDownload) return;

        super_html_playable.download();
    }
}
