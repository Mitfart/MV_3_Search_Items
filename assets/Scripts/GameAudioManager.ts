import { _decorator, assetManager, AudioClip, AudioSource, Component, Tween, tween } from 'cc';

const { ccclass, property } = _decorator;

const GIRL_HAPPY_CLIP_UUIDS = [
    'a23d4689-fda6-48ef-87b4-71a7371d0c23',
    '9ff683a3-d4a8-4e71-a418-3353abbe3361',
    '0f405117-2182-4783-95be-8312a787c665',
    'a7cdd05e-67d2-48b7-a91c-fcae50f87ecb',
];

@ccclass('GameAudioManager')
export class GameAudioManager extends Component {
    @property({ tooltip: 'Try starting audio from load. If false, starts/unmutes after first pointer click.' }) startAudioOnLoad = true;

    @property(AudioClip) musicClip: AudioClip | null = null;
    @property(AudioClip) waterClip: AudioClip | null = null;
    @property(AudioClip) keyClip: AudioClip | null = null;
    @property(AudioClip) keyTurnClip: AudioClip | null = null;
    @property(AudioClip) unlockClip: AudioClip | null = null;
    @property(AudioClip) chainsClip: AudioClip | null = null;
    @property(AudioClip) doorClip: AudioClip | null = null;
    @property(AudioClip) wrongClip: AudioClip | null = null;
    @property(AudioClip) winClip: AudioClip | null = null;
    @property(AudioClip) failClip: AudioClip | null = null;
    @property(AudioClip) cryClip: AudioClip | null = null;
    @property([AudioClip]) girlHappyClips: AudioClip[] = [];

    private ambienceSource: AudioSource | null = null;
    private sfxSource: AudioSource | null = null;
    private musicSource: AudioSource | null = null;
    private crySource: AudioSource | null = null;
    private wrongSource: AudioSource | null = null;
    private canPlayWrong = true;
    private remainingGirlHappyIndices: number[] = [];
    private readonly resumeCryCallback = () => this.startCryLoop();

    protected onLoad(): void {
        this.musicSource = this.node.addComponent(AudioSource);
        this.ambienceSource = this.node.addComponent(AudioSource);
        this.sfxSource = this.node.addComponent(AudioSource);
        this.crySource = this.node.addComponent(AudioSource);
        this.wrongSource = this.node.addComponent(AudioSource);
        this.loadDefaultGirlHappyClips();
        if (this.startAudioOnLoad) this.startAmbience();
    }

    public unlockOrStartAfterInteraction(): void {
        if (!this.startAudioOnLoad) this.startAmbience();
    }

    public playKeyPickup(): void {
        this.stopCryTemporarily();
        this.playOneShot(this.pickGirlHappyClip() || this.keyClip);
    }

    public playKeyTurn(): void {
        this.playOneShot(this.keyTurnClip);
    }

    public playUnlock(): void {
        this.playOneShot(this.unlockClip);
    }

    public playChains(): void {
        this.playOneShot(this.chainsClip);
    }

    public playDoor(): void {
        this.playOneShot(this.doorClip);
    }

    public playWrong(): void {
        this.playWrongGuarded();
    }

    public playWin(): void {
        this.playOneShot(this.winClip);
    }

    public playFail(): void {
        this.playOneShot(this.failClip);
    }

    public stopCry(): void {
        this.unschedule(this.resumeCryCallback);
        if (!this.crySource) return;
        Tween.stopAllByTarget(this.crySource);
        this.crySource.stop();
    }

    private startAmbience(): void {
        if (this.musicSource && this.musicClip && !this.musicSource.playing) {
            this.musicSource.clip = this.musicClip;
            this.musicSource.loop = true;
            this.musicSource.play();
        }

        if (this.ambienceSource && this.waterClip && !this.ambienceSource.playing) {
            this.ambienceSource.clip = this.waterClip;
            this.ambienceSource.loop = true;
            this.ambienceSource.play();
        }

        this.startCryLoop();
    }

    private startCryLoop(): void {
        if (!this.crySource || !this.cryClip || this.crySource.playing) return;
        Tween.stopAllByTarget(this.crySource);
        this.crySource.clip = this.cryClip;
        this.crySource.loop = true;
        this.crySource.volume = 0;
        this.crySource.play();
        tween(this.crySource).to(0.25, { volume: 1 }).start();
    }

    private stopCryTemporarily(): void {
        if (this.crySource) {
            Tween.stopAllByTarget(this.crySource);
            this.crySource.stop();
        }
        this.unschedule(this.resumeCryCallback);
        this.scheduleOnce(this.resumeCryCallback, 3);
    }

    private loadDefaultGirlHappyClips(): void {
        if (this.girlHappyClips.length > 0) return;
        for (const uuid of GIRL_HAPPY_CLIP_UUIDS) {
            assetManager.loadAny(uuid, (error: Error | null, clip: AudioClip | null) => {
                if (!error && clip && this.girlHappyClips.indexOf(clip) < 0) this.girlHappyClips.push(clip);
            });
        }
    }

    private pickGirlHappyClip(): AudioClip | null {
        const clips = this.girlHappyClips.filter(Boolean);
        if (clips.length === 0) return null;
        if (this.remainingGirlHappyIndices.length === 0) this.remainingGirlHappyIndices = clips.map((_, index) => index);

        const bagIndex = Math.floor(Math.random() * this.remainingGirlHappyIndices.length);
        const clipIndex = this.remainingGirlHappyIndices.splice(bagIndex, 1)[0];
        return clips[clipIndex] || null;
    }

    private playWrongGuarded(): void {
        if (!this.wrongClip || !this.wrongSource || !this.canPlayWrong || this.wrongSource.playing) return;
        this.canPlayWrong = false;
        this.wrongSource.clip = this.wrongClip;
        this.wrongSource.loop = false;
        this.wrongSource.play();
        this.unschedule(this.allowWrongSound);
        this.scheduleOnce(this.allowWrongSound, this.getClipDuration(this.wrongClip) + 0.15);
    }

    private allowWrongSound(): void {
        this.canPlayWrong = true;
    }

    private getClipDuration(clip: AudioClip): number {
        const clipLike = clip as AudioClip & { getDuration?: () => number; duration?: number };
        return Math.max(0, clipLike.getDuration?.() ?? clipLike.duration ?? 0);
    }

    private playOneShot(clip: AudioClip | null): void {
        if (!clip || !this.sfxSource) return;
        this.sfxSource.playOneShot(clip, 1);
    }
}
