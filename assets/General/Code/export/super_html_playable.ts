import { error, log, sys } from "cc";

declare global {
    interface Window {
        APP_STORE_URL?: string;
        GOOGLE_PLAY_URL?: string;
        __NON_CANCELABLE_PREVENT_DEFAULT_GUARD__?: boolean;
    }
}

function installNonCancelablePreventDefaultGuard(): void {
    if (typeof window === 'undefined' || window.__NON_CANCELABLE_PREVENT_DEFAULT_GUARD__) return;
    window.__NON_CANCELABLE_PREVENT_DEFAULT_GUARD__ = true;

    const originalPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function (): void {
        if (!this.cancelable) return;
        originalPreventDefault.call(this);
    };
}

installNonCancelablePreventDefaultGuard();

const BASE_APP_STORE_LINK = "https://apps.apple.com/app/hidden-objects-journey-story/id6741472604";
const BASE_GOOGLE_LINK = "https://play.google.com/store/apps/details?id=hidden.objects.games.journey";

enum TargetApp {
    GOOGLE,
    APP_STORE
}

export class super_html_playable {
    private _lastDownloadTs = 0;
    private _downloadInProgress = false;
    private _returnListenersBound = false;

    public download() {
        log("download_requested");

        if (this._downloadInProgress) {
            log("download_blocked_in_progress");
            return;
        }

        const now = Date.now();
        if (now - this._lastDownloadTs < 600) {
            log("download_blocked_cooldown");
            return;
        }
        this._lastDownloadTs = now;
        this._downloadInProgress = true;
        this.bindReturnListeners();
        window.setTimeout(() => this.clearDownloadInProgress(), 600);

        const GOOGLE_URL = window.GOOGLE_PLAY_URL || BASE_GOOGLE_LINK; 
        const APP_STORE_URL = window.APP_STORE_URL || BASE_APP_STORE_LINK; 
        
        if (GOOGLE_URL.trim() == "" && APP_STORE_URL.trim() == "") {
            log("download_no_urls");
            
            this.html_game_download();
        } else {
            log("download");
            
            let url: string;
            let platform: TargetApp = this.getTargetApp();

            if (platform === TargetApp.APP_STORE) {
                url = APP_STORE_URL;
                this.html_set_app_store_url(url);
            } else {
                url = GOOGLE_URL;
                this.html_set_google_play_url(url);
            }
            
            log(`Opening store for ${TargetApp[platform]}: ${url}`);
            if (url.trim() != "" && !this.isVungleEnvironment() && !this.hasSuperHtmlBridge()) this.safeOpen(url);
            
            this.html_game_download(url);
        }
    }
    
    

    private bindReturnListeners(): void {
        if (this._returnListenersBound) return;
        this._returnListenersBound = true;

        window.addEventListener('focus', () => this.clearDownloadInProgress());
        window.addEventListener('pageshow', () => this.clearDownloadInProgress());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.clearDownloadInProgress();
        });
    }

    private clearDownloadInProgress(): void {
        this._downloadInProgress = false;
    }

    private hasSuperHtmlBridge(): boolean {
        const w = window as unknown as Record<string, unknown>;
        return typeof w["super_html"] !== "undefined";
    }

    private isVungleEnvironment(): boolean {
        const ua = (navigator.userAgent || "").toLowerCase();
        const w = window as unknown as Record<string, unknown>;
        return (
            ua.includes("vungle") ||
            typeof w["vungle"] !== "undefined" ||
            typeof w["Vungle"] !== "undefined" ||
            typeof w["vunglePlayable"] !== "undefined" ||
            typeof w["VunglePlayable"] !== "undefined"
        );
    }

    private safeOpen(url: string): void {
        try {
            const newWindow = window.open(url, '_blank');
            if (newWindow === null || newWindow.closed) {
                // Если всплывающее окно заблокировано, используем обходной метод
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            error("Error opening URL:", error);
            // Последняя попытка - просто переходим по ссылке
            window.location.href = url;
        }
    }
    
    
    private getTargetApp(): TargetApp {
        // Для нативных платформ (мобильные приложения)
        if (sys.isNative) {
            if (sys.os === sys.OS.ANDROID) {
                return TargetApp.GOOGLE;
            } else if (sys.os === sys.OS.IOS || sys.os === sys.OS.OSX) {
                return TargetApp.APP_STORE; 
            }
        }
        

        // Для веб-версий (анализ userAgent)
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('android')) {
            return TargetApp.GOOGLE;
        } else if (userAgent.includes('iphone') || 
                userAgent.includes('ipad') || 
                userAgent.includes('ipod') ||
                userAgent.includes('macintosh')) {
            // Добавляем macintosh для macOS - тоже ведем в App Store
            return TargetApp.APP_STORE; 
        }
        
        
        // По умолчанию для всего остального (Windows, Linux и т.д.) - Android
        return TargetApp.GOOGLE;
    }



    private html_game_download(url?: string) {
        //@ts-ignore
        window.super_html && super_html.game_end();
        //@ts-ignore
        window.super_html && super_html.download(url);
    }
    
    private html_set_google_play_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.google_play_url = url);
    }

    private html_set_app_store_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.appstore_url = url);
    }
}
export default new super_html_playable();