import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

type PlayableWindow = Window & {
    ALPlayableAnalytics?: {
        trackEvent?: (eventName: string) => void;
    };
    gameEnd?: () => void;
};

@ccclass('AnalyticsManager')
export class AnalyticsManager extends Component {
    private static readonly emittedEvents = new Set<string>();

    public static trackEvent(eventName: string): void {
        this.emit(eventName);
    }

    public static fireChallengeStarted(): void {
        this.emit('CHALLENGE_STARTED');
    }

    private static emit(eventName: string): void {
        if (eventName != 'CTA_CLICKED') {
            if (this.emittedEvents.has(eventName)) {
                return;
            }
            this.emittedEvents.add(eventName);
        }

        const playable = window as PlayableWindow;
        if (typeof playable.ALPlayableAnalytics?.trackEvent === 'function') {
            playable.ALPlayableAnalytics.trackEvent(eventName);
        } else if (typeof playable.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
            playable.dispatchEvent(new CustomEvent(eventName));
            console.log(`[Analytics] ${eventName}`);
        }
    }
}