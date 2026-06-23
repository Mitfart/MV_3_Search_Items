import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('AnalyticsManager')
export class AnalyticsManager extends Component {
    // ─────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────

    private static isGameEndFired: boolean = false;
    private static isChallengeStartedFired: boolean = false;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    public static trackEvent(eventName: string) {
        if (typeof window !== 'undefined' && typeof window['ALPlayableAnalytics'] !== 'undefined') {
            window['ALPlayableAnalytics'].trackEvent(eventName);
            console.log(`[Analytics] Event sent: ${eventName}`);
        } else {
            console.log(`[Analytics] Event triggered (not sent): ${eventName}`);
        }
    }

    public static fireGameEnd() {
        if (this.isGameEndFired) return;

        if (typeof window !== 'undefined' && typeof window['gameEnd'] === 'function') {
            window['gameEnd']();
            this.isGameEndFired = true;
            console.log('[Mintegral] window.gameEnd() successfully called.');
        }
    }

    public static fireChallengeStarted() {
        if (this.isChallengeStartedFired) return;

        this.isChallengeStartedFired = true;
        this.trackEvent('CHALLENGE_STARTED');
        console.log('[Analytics] CHALLENGE_STARTED fired');
    }
}