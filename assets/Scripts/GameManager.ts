import {
    _decorator,
    Button,
    Color,
    Component,
    EventTouch,
    easing,
    input,
    Input,
    instantiate,
    Label,
    Node,
    Prefab,
    sp,
    tween,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
    view,
} from 'cc';
import { AnalyticsManager } from './AnalyticsManager';
import { GameAudioManager } from './GameAudioManager';
import { PlayerCameraController } from './PlayerCameraController';
import super_html_playable from '../General/Code/export/super_html_playable';

const { ccclass, property } = _decorator;

const TAP_HINT_PULSE_SCALE = 0.86;
const TAP_HINT_PULSE_DURATION = 0.35;
const TAP_HINT_PULSE_DELAY = 0.25;
const KEY_JUMP_SCALE = 1.08;
const LOCK_JUMP_SCALE = 1.08;
const KEY_FLY_SECONDS = 0.72;
const KEY_TURN_SECONDS = 0.18;
const KEY_LOCK_BASE_ANGLE = 90;
const KEY_LOCK_LEFT_OFFSET = 50;
const WRONG_TAP_MAX_DRAG_DISTANCE = 18;
const KEY_VIEW_NODE_NAME = 'View';
const KEY_TUTORIAL_BOUNCE_ANIMATION = 'key5_bounce';
const KEY_STATIC_ANIMATION = 'key5_static';
const KEY_COUNTER_BOUNCE_SCALE = 1.14;
const KEY_COUNTER_BOUNCE_SECONDS = 0.18;
const KEY_COUNTER_JUMP_Y = 16;
const WATER_FX_IDLE_SPEED = 2.6;
const WATER_FX_IDLE_BOB_DISTANCE = 5;
const WATER_FX_IDLE_SCALE_AMOUNT = 0.06;
const WATER_FX_RISING_IDLE_BOB_DISTANCE = 2.5;
const WATER_FX_RISING_IDLE_SCALE_AMOUNT = 0.025;
const WATER_FX_SPLASH_RISE_FACTOR = 0.62;
const WATER_FX_JET_RISE_FACTOR = 0.55;
const HAPPY_END_DOWNLOAD_ENABLE_DELAY = 2.25;
const DRAG_TUTORIAL_DURATION = 1.5;
const DRAG_TUTORIAL_DISTANCE = 250;
const DRAG_TUTORIAL_FADE_SECONDS = 0.12;
const DRAG_TUTORIAL_PRESS_SCALE = 0.9;
const DRAG_TUTORIAL_AFTER_UNLOCK_DELAY = 0.25;
const FIRST_KEY_DRAG_TUTORIAL_FALLBACK_DELAY = KEY_FLY_SECONDS + KEY_TURN_SECONDS + 0.95;
const RANDOM_KEY_SHINE_LOOP_SECONDS = 0.7;
const RANDOM_KEY_SHINE_MIN_LOOPS = 2;
const RANDOM_KEY_SHINE_MAX_LOOPS = 3;
const RANDOM_KEY_SHINE_MIN_GAP = 0.25;
const RANDOM_KEY_SHINE_MAX_GAP = 0.55;

@ccclass('KeySetup')
class KeySetup {
    @property(Node) key: Node | null = null;
    @property(Node) targetPoint: Node | null = null;
    @property(Node) chain: Node | null = null;
}

type KeyEntry = {
    id: number;
    key: Node;
    targetPoint: Node;
    chain: Node;
    collected: boolean;
    animating: boolean;
};

type DangerStage = 0 | 1 | 2;

type FxChildState = {
    node: Node;
    localY: number;
    scale: Vec3;
    topLocalY: number;
    height: number;
    anchorY: number;
};

type WaterVariantState = {
    variant: Node;
    water: Node;
    waterLocalY: number;
    variantLocalY: number;
    variantScaleY: number;
    topOffset: number;
};

type TextLikeComponent = Component & { string: string };

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: [KeySetup], tooltip: 'Explicit key setup entries. Wire every key, target point, and chain node in the scene/prefab inspector.' })
    public keySetups: KeySetup[] = [];
    @property(Node) keysRoot: Node | null = null;
    @property(Node) doorRoot: Node | null = null;
    @property(Node) girlRoot: Node | null = null;
    @property({ type: sp.Skeleton, tooltip: 'Optional new Spine girl view. If set, it drives girl state animations and the old sprite variants are hidden.' })
    public girlSpine: sp.Skeleton | null = null;
    @property(Node) waterRoot: Node | null = null;
    @property(Node) waterFxJetRoot: Node | null = null;
    @property(Node) waterFxSplashRoot: Node | null = null;
    @property({ type: Node, tooltip: 'Node containing the key counter Label or RichText component.' }) keyCounterLabelNode: Node | null = null;
    @property(Node) endTextNode: Node | null = null;
    @property(Node) handCursorNode: Node | null = null;
    @property({ type: Node, tooltip: 'Explicit key node used for the first tutorial hint. Assign Key_6 in the scene.' }) tutorialTargetNode: Node | null = null;
    @property(Prefab) wrongMarkerPrefab: Prefab | null = null;
    @property(GameAudioManager) audioManager: GameAudioManager | null = null;
    @property(PlayerCameraController) cameraController: PlayerCameraController | null = null;

    @property({ tooltip: 'Fail timer duration after water starts rising.' }) failSeconds = 48;
    @property({ tooltip: 'Seconds from launch before water starts rising.' }) floodStartDelaySeconds = 2;
    @property({ tooltip: 'How far the authored water root rises from its design/start position.' }) floodRiseHeight = 220;
    @property({ tooltip: 'Idle seconds before showing the first key hint at game start.' }) initialHintDelaySeconds = 3;
    @property({ tooltip: 'Idle seconds before choosing/playing a key hint after player key clicks.' }) hintDelaySeconds = 7;
    @property({ tooltip: 'Extra seconds before showing hand cursor on the hinted key.' }) handHintDelaySeconds = 7;

    private entries: KeyEntry[] = [];
    private collectedCount = 0;
    private displayedCollectedCount = 0;
    private timerStarted = false;
    private elapsed = 0;
    private terminal: 'none' | 'win' | 'fail' = 'none';
    private activeUnlockAnimations = 0;
    private currentStage: DangerStage = 0;
    private currentHint: KeyEntry | null = null;
    private idleSinceLastKey = 0;
    private currentHintAge = 0;
    private fullScreenDownloadActive = false;
    private challengeStartedFired = false;
    private winFlowStarted = false;
    private milestones = new Set<string>();
    private originalHandScale = new Vec3(1, 1, 1);
    private tutorialLayerNode: Node | null = null;
    private readonly idleWaterBobDistance = 8;
    private readonly idleWaterBobSeconds = 1.2;
    private baseWaterY = 0;
    private waterRiseStartTop = 0;
    private waterRiseEndTop = 0;
    private waterRiseDistance = 0;
    private currentWaterRiseOffset = 0;
    private currentWaterIdleOffset = 0;
    private waterIdleTime = 0;
    private readonly waterVariantConfigs = [
        { variantName: 'Variant_1', waterName: 'Water_1' },
        { variantName: 'Variant_3', waterName: 'Water_3' },
    ];
    private waterVariantStates: WaterVariantState[] = [];
    private waterFxJetBaseLocalY = 0;
    private waterFxJetBaseScale = new Vec3(1, 1, 1);
    private waterFxJetBaseOpacity = 255;
    private waterFxJetChildren: FxChildState[] = [];
    private waterFxSplashBaseLocalY = 0;
    private waterFxSplashTargetLocalY = 0;
    private waterFxSplashBaseScale = new Vec3(1, 1, 1);
    private waterFxSplashBaseOpacity = 255;
    private waterFxSplashChildren: FxChildState[] = [];
    private waterFxCircleState: FxChildState | null = null;
    private waterFxIdleTime = 0;
    private handledTouchEvents = new WeakSet<EventTouch>();
    private clickTargetToEntry = new Map<Node, KeyEntry>();
    private pendingWrongTap: { id: number; x: number; y: number; valid: boolean } | null = null;
    private activeTouchStarts = new Map<number, { x: number; y: number }>();
    private playerDragged = false;
    private terminalFloodProgress = 0;
    private dragTutorialShown = false;
    private preKeyDragTutorialShown = false;
    private postKeyDragTutorialEntry: KeyEntry | null = null;
    private dragTutorialPlaying = false;
    private tutorialsEnabled = false;
    private dragTutorialScheduled = false;
    private dragBlockedUntilTutorialShown = false;
    private randomKeyShineDelay = 0;
    private shiningKeyEntry: KeyEntry | null = null;
    private keyCounterBaseScale = new Vec3(1, 1, 1);
    private keyCounterBasePosition = new Vec3();

    protected onLoad(): void {
        this.discoverSceneData();
        this.hideAllKeyShines();
        this.showFirstKeyShine();
        this.validateRequiredData();
        this.bindKeyClickTargets();
        this.captureWaterLayout();
        if (this.keyCounterLabelNode) {
            this.keyCounterBaseScale = this.keyCounterLabelNode.scale.clone();
            this.keyCounterBasePosition = this.keyCounterLabelNode.position.clone();
        }
        this.updateCounter();
        this.setPreStartFloodPose();
        this.startPreRaiseWaterIdle();
        this.setupGirlSpineView();
        this.setDangerStage(0, false);
        if (this.handCursorNode) {
            this.originalHandScale = this.handCursorNode.scale.clone();
            this.tutorialLayerNode = this.handCursorNode.parent || null;
            this.moveHandToTutorialLayer(this.getTutorialLayerForTarget(this.handCursorNode));
            this.handCursorNode.active = false;
        }
        AnalyticsManager.trackEvent('LOADING');
    }

    protected start(): void {
        AnalyticsManager.trackEvent('LOADED');
        AnalyticsManager.trackEvent('DISPLAYED');
        this.scheduleOnce(() => this.startFloodTimer(), this.floodStartDelaySeconds);
    }

    protected onEnable(): void {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    protected onDisable(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    protected update(dt: number): void {
        this.waterFxIdleTime += dt;

        if (this.terminal !== 'none') {
            this.waterIdleTime += dt;
            this.updateFloodProgress(this.terminalFloodProgress);
            return;
        }

        if (this.timerStarted) this.waterIdleTime += dt;
        if (!this.timerStarted && (this.waterFxJetRoot || this.waterFxSplashRoot)) {
            this.updateWaterFxProgress(0);
        }

        if (this.timerStarted) {
            this.elapsed += dt;
            const t = Math.min(1, this.elapsed / this.failSeconds);
            this.updateFloodProgress(t);
            this.updateDangerStageFromProgress(t);
            if (this.elapsed >= this.failSeconds && this.collectedCount < this.entries.length) this.triggerFail();
        }

        this.updateRandomKeyShine(dt);
        this.updateHintTimers(dt);
        this.updateHandHintPosition();
    }

    private onTouchStart(event: EventTouch): void {
        this.audioManager?.unlockOrStartAfterInteraction();

        if (this.fullScreenDownloadActive) {
            this.markTouchEvent(event);
            this.downloadOnce();
            return;
        }

        if (this.terminal !== 'none' || !this.markTouchEvent(event)) return;

        const uiPos = event.getUILocation();
        this.activeTouchStarts.set(event.getID(), { x: uiPos.x, y: uiPos.y });

        const hit = this.getEntryFromTouchTarget(event);
        if (hit && !hit.collected) {
            this.pendingWrongTap = null;
            this.collectKey(hit);
            return;
        }

        this.pendingWrongTap = { id: event.getID(), x: uiPos.x, y: uiPos.y, valid: true };
    }

    private onTouchMove(event: EventTouch): void {
        const uiPos = event.getUILocation();
        const start = this.activeTouchStarts.get(event.getID());
        if (start && !this.dragBlockedUntilTutorialShown) {
            const dx = uiPos.x - start.x;
            const dy = uiPos.y - start.y;
            if (dx * dx + dy * dy > WRONG_TAP_MAX_DRAG_DISTANCE * WRONG_TAP_MAX_DRAG_DISTANCE) this.playerDragged = true;
        }

        if (!this.pendingWrongTap || this.pendingWrongTap.id !== event.getID()) return;
        const dx = uiPos.x - this.pendingWrongTap.x;
        const dy = uiPos.y - this.pendingWrongTap.y;
        if (dx * dx + dy * dy > WRONG_TAP_MAX_DRAG_DISTANCE * WRONG_TAP_MAX_DRAG_DISTANCE) this.pendingWrongTap.valid = false;
    }

    private onTouchEnd(event: EventTouch): void {
        this.activeTouchStarts.delete(event.getID());
        if (!this.pendingWrongTap || this.pendingWrongTap.id !== event.getID()) return;
        const tap = this.pendingWrongTap;
        this.pendingWrongTap = null;
        if (!tap.valid || this.terminal !== 'none' || this.fullScreenDownloadActive) return;
        const hit = this.getEntryFromTouchTarget(event);
        if (hit && !hit.collected) return;
        this.showWrongTap(tap.x, tap.y);
    }

    private onTouchCancel(event: EventTouch): void {
        this.activeTouchStarts.delete(event.getID());
        if (this.pendingWrongTap?.id === event.getID()) this.pendingWrongTap = null;
    }

    private discoverSceneData(): void {
        this.entries = [];
        const setups = Array.isArray(this.keySetups) ? this.keySetups : [];
        for (let index = 0; index < setups.length; index += 1) {
            const setup = setups[index];
            if (!setup?.key || !setup.targetPoint || !setup.chain || !this.isNodeUnder(setup.targetPoint, setup.chain)) continue;
            this.entries.push({
                id: index + 1,
                key: setup.key,
                targetPoint: setup.targetPoint,
                chain: setup.chain,
                collected: false,
                animating: false,
            });
        }
    }

    private isNodeUnder(node: Node, root: Node): boolean {
        for (let current: Node | null = node; current; current = current.parent) {
            if (current === root) return true;
        }
        return false;
    }

    private validateRequiredData(): void {
        const missing: string[] = [];
        const assignedKeyCount = Array.isArray(this.keySetups) ? this.keySetups.length : 0;
        if (assignedKeyCount === 0) missing.push('keySetups array');
        if (!this.doorRoot) missing.push('doorRoot');
        if (!this.girlRoot) missing.push('girlRoot');
        if (!this.waterRoot) missing.push('waterRoot');
        if (!this.tutorialTargetNode) missing.push('tutorialTargetNode');
        if (!this.cameraController) missing.push('cameraController');
        if (!this.getKeyCounterText()) missing.push('keyCounterLabelNode');
        if (!this.endTextNode) console.warn('[GameManager] Optional endTextNode is not assigned; win/fail text will be skipped until wired.');
        if (this.entries.length !== assignedKeyCount) missing.push(`key-lock entries (${this.entries.length}/${assignedKeyCount})`);

        if (missing.length > 0) {
            console.error(`[GameManager] Missing required setup: ${missing.join(', ')}`);
            this.enabled = false;
        }
    }

    private bindKeyClickTargets(): void {
        this.clickTargetToEntry.clear();
        for (const entry of this.entries) {
            const key = entry.key;
            const transform = key.getComponent(UITransform) || key.addComponent(UITransform);
            const button = key.getComponent(Button) || key.addComponent(Button);

            if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
                console.warn(`[GameManager] ${key.name} has an empty UITransform; set its invisible click size in the prefab/scene.`);
            }

            button.interactable = true;
            button.target = key;
            key.off(Button.EventType.CLICK);
            key.on(Button.EventType.CLICK, () => this.onKeyObjectClick(entry), this);
            key.off(Node.EventType.TOUCH_START);
            key.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onKeyObjectTouchStart(entry, event), this, true);
            this.clickTargetToEntry.set(key, entry);
        }
    }

    private onKeyObjectClick(entry: KeyEntry): void {
        if (this.fullScreenDownloadActive) {
            this.downloadOnce();
            return;
        }
        if (this.terminal !== 'none' || entry.collected) return;
        this.collectKey(entry);
    }

    private onKeyObjectTouchStart(entry: KeyEntry, event: EventTouch): void {
        this.audioManager?.unlockOrStartAfterInteraction();
        this.markTouchEvent(event);
        if (this.fullScreenDownloadActive) {
            this.downloadOnce();
            return;
        }
        if (this.terminal !== 'none' || entry.collected) return;
        this.collectKey(entry);
    }

    private getEntryFromTouchTarget(event: EventTouch): KeyEntry | null {
        let target = event.target as Node | null;
        while (target) {
            const entry = this.clickTargetToEntry.get(target);
            if (entry) return entry;
            target = target.parent;
        }
        return null;
    }

    private markTouchEvent(event: EventTouch): boolean {
        if (this.handledTouchEvents.has(event)) return false;
        this.handledTouchEvents.add(event);
        return true;
    }

    private collectKey(entry: KeyEntry): void {
        if (entry.collected || this.terminal !== 'none') return;

        this.fireChallengeStartedOnce();
        entry.collected = true;
        entry.animating = true;
        const button = entry.key.getComponent(Button);
        if (button) button.interactable = false;
        this.collectedCount += 1;
        if (this.collectedCount === 1 && !this.dragTutorialShown) {
            this.postKeyDragTutorialEntry = entry;
            this.setDragBlockedUntilTutorialShown(true);
            this.scheduleOnce(() => this.requestPostKeyDragTutorial(), FIRST_KEY_DRAG_TUTORIAL_FALLBACK_DELAY);
        }
        this.idleSinceLastKey = 0;
        this.currentHint = null;
        this.stopKeyHint(entry.key);
        this.resetRandomKeyShineDelay();
        this.audioManager?.playKeyPickup();
        if (this.terminal === 'none') this.playGirlAnimation('05_happy1', false, '01_idle');

        this.fireProgressEvents();

        if (this.collectedCount >= this.entries.length) {
            this.cameraController?.resetDragToDefault();
            this.setTerminalState('win');
            AnalyticsManager.trackEvent('CHALLENGE_SOLVED');
            this.scheduleOnce(() => this.tryStartWinFlow(), 1.2);
            this.scheduleOnce(() => this.forceStartWinFlow(), 1.8);
        }

        this.finishKeyTap(entry);
    }

    private startFloodTimer(): void {
        if (this.timerStarted || this.terminal !== 'none') return;
        this.timerStarted = true;
        this.tutorialsEnabled = true;
        this.stopPreRaiseWaterIdle();
        this.fireChallengeStartedOnce();
    }

    private fireChallengeStartedOnce(): void {
        if (this.challengeStartedFired) return;
        this.challengeStartedFired = true;
        AnalyticsManager.fireChallengeStarted();
    }

    private finishKeyTap(entry: KeyEntry): void {
        this.activeUnlockAnimations += 1;
        const key = entry.key;
        Tween.stopAllByTarget(key);
        this.flyKeyToLock(entry, () => {
            this.audioManager?.playKeyTurn();
            this.audioManager?.playUnlock();
            this.animateAssignedChain(entry);
        });
    }

    private flyKeyToLock(entry: KeyEntry, onArrive: () => void): void {
        const key = entry.key;
        const chain = entry.chain;
        const targetPoint = entry.targetPoint;
        const keyParent = key.parent;
        if (!keyParent) {
            key.active = false;
            onArrive();
            return;
        }

        const endLocal = this.toLocalPosition(keyParent, targetPoint.worldPosition);
        endLocal.x -= KEY_LOCK_LEFT_OFFSET;
        const targetAngle = KEY_LOCK_BASE_ANGLE + targetPoint.angle;
        const originalScale = key.scale.clone();
        const flyScale = new Vec3(originalScale.x * 0.82, originalScale.y * 0.82, originalScale.z);

        key.active = true;
        key.setSiblingIndex(keyParent.children.length - 1);
        tween(key)
            .to(KEY_FLY_SECONDS, { position: endLocal, scale: flyScale, angle: targetAngle }, { easing: 'quadInOut' })
            .to(KEY_TURN_SECONDS, { scale: new Vec3(0, flyScale.y, flyScale.z) }, { easing: 'quadIn' })
            .call(() => {
                key.active = false;
                this.jumpScale(chain, LOCK_JUMP_SCALE, 0.18);
                onArrive();
            })
            .start();
    }

    private animateAssignedChain(entry: KeyEntry): void {
        this.showCollectedKeyInCounter();
        const chain = entry.chain;
        this.audioManager?.playChains();

        const pos = chain.position.clone();
        tween(chain)
            .delay(Math.random() * 0.08)
            .to(0.45, { position: new Vec3(pos.x, pos.y - 90, pos.z), angle: chain.angle + (Math.random() > 0.5 ? 10 : -10) }, { easing: 'quadIn' })
            .call(() => this.fadeOutNode(chain, 0.2))
            .delay(0.22)
            .call(() => {
                chain.active = false;
                this.finishUnlockAnimation(entry);
            })
            .start();
    }

    private finishUnlockAnimation(entry: KeyEntry): void {
        entry.animating = false;
        this.activeUnlockAnimations = Math.max(0, this.activeUnlockAnimations - 1);
        if (entry === this.postKeyDragTutorialEntry) {
            this.postKeyDragTutorialEntry = null;
            this.requestPostKeyDragTutorial();
        }
        this.tryStartWinFlow();
    }

    private requestPostKeyDragTutorial(): void {
        if (this.terminal !== 'none' || this.dragTutorialShown || this.dragTutorialScheduled || (!this.dragBlockedUntilTutorialShown && this.playerDragged)) return;

        this.dragTutorialScheduled = true;
        this.scheduleOnce(() => {
            this.dragTutorialScheduled = false;
            if (this.dragBlockedUntilTutorialShown || !this.playerDragged) this.showDragTutorial();
        }, DRAG_TUTORIAL_AFTER_UNLOCK_DELAY);
    }

    private setDragBlockedUntilTutorialShown(blocked: boolean): void {
        this.dragBlockedUntilTutorialShown = blocked;
        if (this.cameraController) this.cameraController.dragBlocked = blocked;
    }

    private tryStartWinFlow(): void {
        if (this.winFlowStarted || this.terminal !== 'win') return;
        const allCollected = this.entries.length > 0 && this.entries.every((entry) => entry.collected);
        const anyAnimating = this.entries.some((entry) => entry.animating);
        if (!allCollected || anyAnimating) return;
        this.startWinFlow();
    }

    private forceStartWinFlow(): void {
        if (this.winFlowStarted || this.terminal !== 'win') return;
        this.startWinFlow();
    }

    private triggerFail(): void {
        if (this.terminal !== 'none') return;
        this.setTerminalState('fail');
        AnalyticsManager.trackEvent('CHALLENGE_FAILED');
        this.audioManager?.playFail();
        this.playGirlAnimation('08_gameover', false);
        this.showEndText('<b>Break down the <color=#ff9c08>door</color>!</b>');
        this.activateFullScreenDownload();
    }

    private setTerminalState(state: 'win' | 'fail'): void {
        if (this.terminal !== 'none') return;
        this.terminalFloodProgress = this.failSeconds > 0 ? Math.max(0, Math.min(1, this.elapsed / this.failSeconds)) : 0;
        this.terminal = state;
        this.timerStarted = false;
        this.audioManager?.stopCry();
        this.stopHandHint();
        this.pendingWrongTap = null;
        this.updateFloodProgress(this.terminalFloodProgress);
    }


    private startWinFlow(): void {
        if (this.winFlowStarted) return;
        this.winFlowStarted = true;
        this.audioManager?.playDoor();
        this.audioManager?.playWin();
        this.playGirlAnimation('09_victory', false);
        if (this.doorRoot) {
            this.hideDoorRootQuickly();
            this.scheduleOnce(() => this.showEndText('<b>Open the <color=#ff9c08>door</color>!</b>'), 0.24);
        } else {
            this.showEndText('<b>Open the <color=#ff9c08>door</color>!</b>');
        }
        this.scheduleOnce(() => this.activateDownloadAfterHappyEnd(), HAPPY_END_DOWNLOAD_ENABLE_DELAY);
    }

    private hideDoorRootQuickly(): void {
        if (!this.doorRoot) return;
        const door = this.doorRoot;
        this.fadeOutNodeTree(door, 0.08);
        this.scheduleOnce(() => {
            door.active = false;
        }, 0.1);
    }

    private fadeOutNodeTree(root: Node, seconds: number): void {
        const fade = (node: Node) => {
            node.active = true;
            const opacity = this.ensureOpacity(node);
            Tween.stopAllByTarget(node);
            Tween.stopAllByTarget(opacity);
            tween(opacity).to(seconds, { opacity: 0 }).start();
            for (const child of node.children) fade(child);
        };
        fade(root);
    }

    private showEndText(text: string): void {
        if (!this.endTextNode) return;
        const node = this.endTextNode;
        this.setEndTextString(text);
        node.active = true;
        const opacity = this.ensureOpacity(node);
        opacity.opacity = 0;
        tween(opacity)
            .to(0.25, { opacity: 255 })
            .call(() => {
                AnalyticsManager.trackEvent('ENDCARD_SHOWN');
                this.scheduleOnce(() => this.showHandAtDoor(), 1.0);
            })
            .start();
    }

    private setEndTextString(text: string): void {
        if (!this.endTextNode) return;
        const label = this.endTextNode.getComponent(Label);
        if (label) {
            label.string = text;
            return;
        }
        const richText = this.endTextNode.getComponent('cc.RichText' as never) as unknown as { string: string } | null;
        if (richText) richText.string = text;
    }

    private activateDownloadAfterHappyEnd(): void {
        if (this.terminal !== 'win' || !this.winFlowStarted) return;
        this.activateFullScreenDownload();
    }

    private activateFullScreenDownload(): void {
        this.fullScreenDownloadActive = true;
    }

    private downloadOnce(): void {
        AnalyticsManager.trackEvent('CTA_CLICKED');
        super_html_playable.download();
    }

    private updateCounter(): void {
        const counter = this.getKeyCounterText();
        if (counter) counter.string = `${this.displayedCollectedCount}/${this.entries.length}`;
    }

    private showCollectedKeyInCounter(): void {
        this.displayedCollectedCount = Math.min(this.displayedCollectedCount + 1, this.collectedCount);
        this.updateCounter();
        this.bounceKeyCounter();
    }

    private bounceKeyCounter(): void {
        const node = this.keyCounterLabelNode;
        if (!node) return;

        const baseScale = this.keyCounterBaseScale;
        const basePosition = this.keyCounterBasePosition;
        Tween.stopAllByTarget(node);
        node.setScale(baseScale);
        node.setPosition(basePosition);
        tween(node)
            .to(KEY_COUNTER_BOUNCE_SECONDS, {
                scale: new Vec3(baseScale.x * KEY_COUNTER_BOUNCE_SCALE, baseScale.y * KEY_COUNTER_BOUNCE_SCALE, baseScale.z),
                position: new Vec3(basePosition.x, basePosition.y + KEY_COUNTER_JUMP_Y, basePosition.z),
            }, { easing: easing.sineOut })
            .to(KEY_COUNTER_BOUNCE_SECONDS, { scale: baseScale.clone(), position: basePosition.clone() }, { easing: easing.sineInOut })
            .start();
    }

    private getKeyCounterText(): TextLikeComponent | null {
        if (!this.keyCounterLabelNode) return null;
        return this.keyCounterLabelNode.getComponent(Label) || this.keyCounterLabelNode.getComponent('cc.RichText' as never) as unknown as TextLikeComponent | null;
    }

    private fireProgressEvents(): void {
        const map: Record<number, string> = { 2: 'CHALLENGE_PASS_25', 3: 'CHALLENGE_PASS_50', 4: 'CHALLENGE_PASS_75' };
        const eventName = map[this.collectedCount];
        if (eventName && !this.milestones.has(eventName)) {
            this.milestones.add(eventName);
            AnalyticsManager.trackEvent(eventName);
        }
    }

    private setPreStartFloodPose(): void {
        this.updateFloodProgress(0);
        this.startStaticWaterFxIdle();
    }

    private captureWaterLayout(): void {
        if (!this.waterRoot) return;
        this.baseWaterY = this.waterRoot.position.y;
        this.captureWaterVariants();
        this.waterFxJetRoot = this.waterFxJetRoot || this.waterRoot.getChildByName('Water_FX_Jet') || this.waterRoot.getChildByName('FX') || this.waterRoot.getChildByName('Water_FX') || null;
        this.waterFxSplashRoot = this.waterFxSplashRoot || this.waterRoot.getChildByName('Water_FX_Splash') || null;

        if (this.waterFxJetRoot) {
            this.waterFxJetBaseLocalY = this.waterFxJetRoot.position.y;
            this.waterFxJetBaseScale = this.waterFxJetRoot.scale.clone();
            this.waterFxJetBaseOpacity = this.getOpacity(this.waterFxJetRoot);
            this.waterFxJetChildren = this.captureFxChildren(this.waterFxJetRoot);
        }

        if (this.waterFxSplashRoot) {
            this.waterFxSplashBaseLocalY = this.waterFxSplashRoot.position.y;
            this.waterFxSplashTargetLocalY = this.waterFxSplashBaseLocalY + this.getWaterRiseDistance() * WATER_FX_SPLASH_RISE_FACTOR;
            this.waterFxSplashBaseScale = this.waterFxSplashRoot.scale.clone();
            this.waterFxSplashBaseOpacity = this.getOpacity(this.waterFxSplashRoot);
            this.waterFxSplashChildren = this.captureFxChildren(this.waterFxSplashRoot);
            this.waterFxCircleState = this.waterFxSplashChildren.find((state) => /circle/i.test(state.node.name)) || null;
        }
    }

    private captureFxChildren(root: Node): FxChildState[] {
        return root.children.map((node) => {
            const transform = node.getComponent(UITransform);
            const height = transform?.contentSize.height || 0;
            const anchorY = transform?.anchorY ?? 0.5;
            const scale = node.scale.clone();
            const localY = node.position.y;
            return {
                node,
                localY,
                scale,
                topLocalY: localY + this.getScaledTopOffset(height, anchorY, scale.y),
                height,
                anchorY,
            };
        });
    }

    private startPreRaiseWaterIdle(): void {
        if (!this.waterRoot) return;
        const pos = this.waterRoot.position;
        Tween.stopAllByTarget(this.waterRoot);
        tween(this.waterRoot).repeatForever(
            tween(this.waterRoot)
                .to(this.idleWaterBobSeconds, { position: new Vec3(pos.x, this.baseWaterY + this.idleWaterBobDistance, pos.z) }, { easing: 'sineInOut' })
                .to(this.idleWaterBobSeconds, { position: new Vec3(pos.x, this.baseWaterY, pos.z) }, { easing: 'sineInOut' })
                .to(this.idleWaterBobSeconds, { position: new Vec3(pos.x, this.baseWaterY - this.idleWaterBobDistance, pos.z) }, { easing: 'sineInOut' })
                .to(this.idleWaterBobSeconds, { position: new Vec3(pos.x, this.baseWaterY, pos.z) }, { easing: 'sineInOut' })
        ).start();
    }

    private stopPreRaiseWaterIdle(): void {
        if (!this.waterRoot) return;
        Tween.stopAllByTarget(this.waterRoot);
        this.waterIdleTime = 0;
        this.currentWaterIdleOffset = 0;
        this.updateFloodProgress(0);
    }

    private updateFloodProgress(t: number): void {
        if (!this.waterRoot) return;
        const progress = Math.max(0, Math.min(1, t));
        const pos = this.waterRoot.position;
        this.waterRoot.setPosition(pos.x, this.baseWaterY, pos.z);
        this.updateWaterVariantPositions(progress);
        this.updateWaterFxProgress(progress);
    }

    private updateDangerStageFromProgress(t: number): void {
        const stage: DangerStage = t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2;
        if (stage !== this.currentStage) this.setDangerStage(stage, true);
    }

    private setDangerStage(stage: DangerStage, animated: boolean): void {
        this.currentStage = stage;
        const girlNames = ['Variant_1', 'Variant_2_Scared', 'Variant_3'];
        if (!this.girlSpine) this.activateVariant(this.girlRoot, girlNames[stage], animated);
        else if (this.terminal === 'none') this.playGirlAnimation(stage === 0 ? '01_idle' : stage === 1 ? '03_scared' : '04_look', true);
        // Water variants are position-aligned and faded in updateFloodProgress.
        // Keep the girl in her authored scene position. Do not parent her to rising water,
        // otherwise she gets an extra upward movement as the flood animates.
    }

    private setupGirlSpineView(): void {
        if (!this.girlSpine) return;
        for (const child of this.girlRoot?.children || []) {
            if (/^Variant_/.test(child.name)) child.active = false;
        }
        this.girlSpine.node.active = true;
        this.playGirlAnimation('01_idle', true);
    }

    private playGirlAnimation(animationName: string, loop: boolean, nextLoopAnimationName?: string): void {
        if (!this.girlSpine) return;
        try {
            this.girlSpine.clearTracks();
            this.girlSpine.setAnimation(0, animationName, loop);
            if (nextLoopAnimationName) this.girlSpine.addAnimation(0, nextLoopAnimationName, true, 0);
        } catch (error) {
            console.warn(`[GameManager] Girl Spine animation '${animationName}' is unavailable.`, error);
        }
    }

    private activateVariant(root: Node | null, activeName: string, animated: boolean): void {
        if (!root) return;
        for (const child of root.children.filter((n) => /^Variant_/.test(n.name))) {
            const shouldShow = child.name === activeName;
            const opacity = this.ensureOpacity(child);
            Tween.stopAllByTarget(opacity);
            if (shouldShow) {
                child.active = true;
                if (animated) {
                    opacity.opacity = Math.min(opacity.opacity, 1);
                    tween(opacity).to(0.25, { opacity: 255 }).start();
                } else opacity.opacity = 255;
            } else if (child.active) {
                if (animated) tween(opacity).to(0.25, { opacity: 0 }).call(() => child.active = false).start();
                else {
                    opacity.opacity = 0;
                    child.active = false;
                }
            }
        }
    }

    private updateHintTimers(dt: number): void {
        if (this.terminal !== 'none' || !this.tutorialsEnabled) return;
        this.idleSinceLastKey += dt;
        if (this.currentHint) {
            this.currentHintAge += dt;
            if (!this.isValidKeyHintTarget(this.currentHint)) {
                this.stopKeyHint(this.currentHint.key);
                this.currentHint = null;
                return;
            }
            if (!this.handCursorNode?.active) this.showHandAtNode(this.currentHint.key);
            return;
        }
        if (this.dragTutorialPlaying) return;
        const delay = this.collectedCount === 0 ? 0 : this.hintDelaySeconds;
        if (this.idleSinceLastKey >= delay) {
            const candidates = this.entries.filter((e) => this.isValidKeyHintTarget(e));
            if (candidates.length === 0) return;
            const tutorialTarget = this.getTutorialTargetEntry(candidates);
            const target = this.collectedCount === 0 && tutorialTarget ? tutorialTarget : candidates[Math.floor(Math.random() * candidates.length)];
            if (this.collectedCount === 0 && !this.preKeyDragTutorialShown && this.cameraController && !this.cameraController.isWorldPositionVisible(target.key.worldPosition)) {
                this.preKeyDragTutorialShown = true;
                this.showDragTutorial(false, () => this.startHint(target));
                return;
            }
            this.startHint(target);
        }
    }

    private showDragTutorial(markPostKeyShown = true, onComplete?: () => void): void {
        if (this.terminal !== 'none' || (!this.dragBlockedUntilTutorialShown && this.playerDragged) || (markPostKeyShown && this.dragTutorialShown) || !this.handCursorNode) return;
        if (markPostKeyShown) {
            this.dragTutorialShown = true;
            this.setDragBlockedUntilTutorialShown(false);
        }
        this.dragTutorialPlaying = true;
        this.currentHint = null;
        this.hideAllKeyShines();

        const visible = view.getVisibleSize();
        const start = new Vec3(visible.width * 0.5, visible.height * 0.5, 0);
        const end = this.cameraController?.isLandscapeView()
            ? new Vec3(start.x, start.y - DRAG_TUTORIAL_DISTANCE, start.z)
            : new Vec3(start.x - DRAG_TUTORIAL_DISTANCE, start.y, start.z);

        this.stopHandTweens();
        this.moveHandToTutorialLayer(this.tutorialLayerNode);
        if (this.handCursorNode.parent) this.handCursorNode.parent.active = true;
        this.handCursorNode.active = true;
        this.handCursorNode.angle = 0;
        this.handCursorNode.setScale(this.originalHandScale);
        this.handCursorNode.setWorldPosition(start);
        const opacity = this.ensureOpacity(this.handCursorNode);
        opacity.opacity = 0;

        const drag = { t: 0 };
        const pressedScale = new Vec3(
            this.originalHandScale.x * DRAG_TUTORIAL_PRESS_SCALE,
            this.originalHandScale.y * DRAG_TUTORIAL_PRESS_SCALE,
            this.originalHandScale.z,
        );
        const updateHandDrag = (target?: { t: number }) => {
            const t = target?.t ?? 0;
            this.handCursorNode?.setWorldPosition(
                start.x + (end.x - start.x) * t,
                start.y + (end.y - start.y) * t,
                start.z,
            );
        };

        tween(opacity)
            .to(DRAG_TUTORIAL_FADE_SECONDS, { opacity: 255 }, { easing: easing.quadOut })
            .delay(Math.max(0, DRAG_TUTORIAL_DURATION - DRAG_TUTORIAL_FADE_SECONDS * 2))
            .to(DRAG_TUTORIAL_FADE_SECONDS, { opacity: 0 }, { easing: easing.quadIn })
            .start();
        tween(this.handCursorNode)
            .to(DRAG_TUTORIAL_FADE_SECONDS, { scale: pressedScale }, { easing: easing.quadOut })
            .delay(Math.max(0, DRAG_TUTORIAL_DURATION - DRAG_TUTORIAL_FADE_SECONDS * 2))
            .to(DRAG_TUTORIAL_FADE_SECONDS, { scale: this.originalHandScale }, { easing: easing.quadInOut })
            .start();
        this.cameraController?.playTutorialDrag(DRAG_TUTORIAL_DURATION, DRAG_TUTORIAL_DISTANCE);
        tween(drag)
            .to(DRAG_TUTORIAL_DURATION * 0.5, { t: 1 }, { easing: easing.sineInOut, onUpdate: updateHandDrag })
            .to(DRAG_TUTORIAL_DURATION * 0.5, { t: 0 }, { easing: easing.sineInOut, onUpdate: updateHandDrag })
            .call(() => {
                this.dragTutorialPlaying = false;
                this.stopHandHint();
                onComplete?.();
            })
            .start();
    }

    private getTutorialTargetEntry(candidates: KeyEntry[]): KeyEntry | null {
        if (!this.tutorialTargetNode) return null;
        return candidates.find((entry) => entry.key === this.tutorialTargetNode) || null;
    }

    private startHint(entry: KeyEntry): void {
        if (!this.isValidKeyHintTarget(entry)) return;
        this.hideAllKeyShines();
        this.setKeyShine(entry, true);
        this.currentHint = entry;
        this.currentHintAge = 0;
        this.showHandAtNode(entry.key);
    }

    private stopKeyHint(key: Node): void {
        Tween.stopAllByTarget(key);
        this.hideAllKeyShines();
        this.stopHandHint();
    }

    private isValidKeyHintTarget(entry: KeyEntry): boolean {
        return !entry.collected && !entry.animating && entry.key?.activeInHierarchy === true;
    }

    private updateRandomKeyShine(dt: number): void {
        if (this.terminal !== 'none' || this.dragTutorialPlaying || this.currentHint) return;
        if (this.collectedCount === 0) {
            this.showFirstKeyShine();
            return;
        }

        this.randomKeyShineDelay -= dt;
        if (this.randomKeyShineDelay > 0) return;

        const candidates = this.entries.filter((entry) => this.isValidKeyHintTarget(entry));
        if (candidates.length === 0) return;

        this.showOnlyKeyShine(candidates[Math.floor(Math.random() * candidates.length)]);
        this.resetRandomKeyShineDelay();
    }

    private showFirstKeyShine(): void {
        const firstKey = this.tutorialTargetNode
            ? this.entries.find((entry) => entry.key === this.tutorialTargetNode && this.isValidKeyHintTarget(entry))
            : this.entries.find((entry) => entry.id === 1 && this.isValidKeyHintTarget(entry));
        if (!firstKey || this.shiningKeyEntry === firstKey) return;
        this.showOnlyKeyShine(firstKey);
    }

    private showOnlyKeyShine(entry: KeyEntry): void {
        this.hideAllKeyShines();
        this.setKeyShine(entry, true);
        this.shiningKeyEntry = entry;
    }

    private resetRandomKeyShineDelay(): void {
        const loops = RANDOM_KEY_SHINE_MIN_LOOPS + Math.floor(Math.random() * (RANDOM_KEY_SHINE_MAX_LOOPS - RANDOM_KEY_SHINE_MIN_LOOPS + 1));
        const gap = RANDOM_KEY_SHINE_MIN_GAP + Math.random() * (RANDOM_KEY_SHINE_MAX_GAP - RANDOM_KEY_SHINE_MIN_GAP);
        this.randomKeyShineDelay = loops * RANDOM_KEY_SHINE_LOOP_SECONDS + gap;
    }

    private hideAllKeyShines(): void {
        for (const entry of this.entries) this.setKeyShine(entry, false);
        this.shiningKeyEntry = null;
    }

    private setKeyShine(entry: KeyEntry, active: boolean): void {
        const shine = entry.key.getChildByName(KEY_VIEW_NODE_NAME);
        if (!shine) return;
        shine.active = true;
        const skeleton = shine.getComponent(sp.Skeleton);
        if (!skeleton) return;
        const animation = active ? KEY_TUTORIAL_BOUNCE_ANIMATION : KEY_STATIC_ANIMATION;
        (skeleton as unknown as { setAnimation?: (trackIndex: number, name: string, loop: boolean) => void }).setAnimation?.(0, animation, true);
    }

    private showHandAtNode(target: Node): void {
        if (!this.handCursorNode || !target.activeInHierarchy) return;
        this.showHandAtWorldPosition(target.worldPosition, this.getTutorialLayerForTarget(target));
    }

    private showHandAtWorldPosition(worldPosition: Readonly<Vec3>, layer: Node | null = null): void {
        if (!this.handCursorNode) return;
        this.moveHandToTutorialLayer(layer);

        const scale = Math.max(0.01, this.originalHandScale.x || 1);
        const pulseScale = scale * TAP_HINT_PULSE_SCALE;
        const opacity = this.ensureOpacity(this.handCursorNode);

        this.stopHandTweens();
        this.handCursorNode.active = true;
        this.handCursorNode.angle = 0;
        this.handCursorNode.setScale(scale, scale, this.originalHandScale.z || 1);
        this.positionHandAtWorldPosition(worldPosition);

        opacity.opacity = Math.min(opacity.opacity, 1);
        tween(opacity).to(0.2, { opacity: 255 }, { easing: easing.quadOut }).start();
        tween(this.handCursorNode)
            .repeatForever(
                tween(this.handCursorNode)
                    .to(TAP_HINT_PULSE_DURATION, { scale: new Vec3(pulseScale, pulseScale, this.originalHandScale.z || 1) }, { easing: easing.quadInOut })
                    .to(TAP_HINT_PULSE_DURATION, { scale: new Vec3(scale, scale, this.originalHandScale.z || 1) }, { easing: easing.quadInOut })
                    .delay(TAP_HINT_PULSE_DELAY)
            )
            .start();
    }

    private updateHandHintPosition(): void {
        if (!this.currentHint || !this.handCursorNode?.active) return;
        if (this.currentHint.collected || !this.currentHint.key.activeInHierarchy) {
            this.stopHandHint();
            return;
        }
        this.positionHandAtTarget(this.currentHint.key);
    }

    private positionHandAtTarget(target: Node): void {
        this.moveHandToTutorialLayer(this.getTutorialLayerForTarget(target));
        this.positionHandAtWorldPosition(target.worldPosition);
    }

    private positionHandAtWorldPosition(worldPosition: Readonly<Vec3>): void {
        if (!this.handCursorNode) return;
        this.moveHandToTutorialLayer(this.getTutorialLayerForTarget(this.handCursorNode));
        this.handCursorNode.setWorldPosition(worldPosition.x, worldPosition.y, worldPosition.z);
    }

    private stopHandHint(): void {
        if (!this.handCursorNode) return;
        this.stopHandTweens();
        const opacity = this.ensureOpacity(this.handCursorNode);
        opacity.opacity = 0;
        this.handCursorNode.active = false;
    }

    private stopHandTweens(): void {
        if (this.handCursorNode) Tween.stopAllByTarget(this.handCursorNode);
        const opacity = this.handCursorNode?.getComponent(UIOpacity) || null;
        if (opacity) Tween.stopAllByTarget(opacity);
    }

    private showHandAtDoor(): void {
        const target = this.getDoorTutorialTarget();
        if (!target) return;
        const layer = this.getTutorialLayerForTarget(target);
        if (target.activeInHierarchy) this.showHandAtNode(target);
        else this.showHandAtWorldPosition(target.worldPosition, layer);
    }

    private getDoorTutorialTarget(): Node | null {
        if (!this.doorRoot) return null;
        return this.doorRoot.getChildByName('Door_Closed') || this.doorRoot;
    }

    private getTutorialLayerForTarget(_target: Node): Node | null {
        return this.tutorialLayerNode || this.handCursorNode?.parent || null;
    }

    private moveHandToTutorialLayer(layer: Node | null): void {
        if (!this.handCursorNode || !layer) return;
        layer.active = true;
        const worldPosition = this.handCursorNode.worldPosition.clone();
        if (this.handCursorNode.parent !== layer) {
            this.handCursorNode.setParent(layer);
            this.handCursorNode.setWorldPosition(worldPosition);
        }
        this.handCursorNode.setSiblingIndex(layer.children.length - 1);
    }

    private showWrongTap(x: number, y: number): void {
        this.audioManager?.playWrong();
        let marker: Node;
        if (this.wrongMarkerPrefab) {
            marker = instantiate(this.wrongMarkerPrefab);
        } else {
            marker = new Node('WrongTapMarker');
            const label = marker.addComponent(Label);
            label.string = '×';
            label.fontSize = 64;
            label.color = new Color(255, 45, 45, 255);
            const ui = marker.getComponent(UITransform) || marker.addComponent(UITransform);
            ui.setContentSize(80, 80);
        }
        const markerParent = this.keyCounterLabelNode?.parent || this.node;
        markerParent.addChild(marker);
        marker.setWorldPosition(x, y, 0);
        const opacity = this.ensureOpacity(marker);
        opacity.opacity = 255;
        tween(marker).to(0.35, { scale: new Vec3(1.15, 1.15, 1) }).start();
        tween(opacity).to(0.45, { opacity: 0 }).call(() => marker.destroy()).start();
    }

    private startStaticWaterFxIdle(): void {
        this.setWaterFxVisibleStatic();
        this.updateWaterFxProgress(0);
    }

    private setWaterFxVisibleStatic(): void {
        if (this.waterFxJetRoot) {
            Tween.stopAllByTarget(this.waterFxJetRoot);
            this.waterFxJetRoot.active = true;
            this.waterFxJetRoot.setScale(this.waterFxJetBaseScale);
            const opacity = this.ensureOpacity(this.waterFxJetRoot);
            Tween.stopAllByTarget(opacity);
            opacity.opacity = this.waterFxJetBaseOpacity;
        }

        if (this.waterFxSplashRoot) {
            Tween.stopAllByTarget(this.waterFxSplashRoot);
            this.waterFxSplashRoot.active = true;
            this.waterFxSplashRoot.setScale(this.waterFxSplashBaseScale);
            const opacity = this.ensureOpacity(this.waterFxSplashRoot);
            Tween.stopAllByTarget(opacity);
            opacity.opacity = this.waterFxSplashBaseOpacity;
        }

        this.resetWaterFxChildren();
    }

    private resetWaterFxChildren(): void {
        for (const state of this.waterFxJetChildren) {
            Tween.stopAllByTarget(state.node);
            state.node.setPosition(state.node.position.x, state.localY, state.node.position.z);
            state.node.setScale(state.scale);
        }
        for (const state of this.waterFxSplashChildren) {
            Tween.stopAllByTarget(state.node);
            state.node.setPosition(state.node.position.x, state.localY, state.node.position.z);
            state.node.setScale(state.scale);
        }
    }

    private updateWaterFxProgress(progress: number): void {
        const level = Math.max(0, Math.min(1, progress));
        const easedLevel = easing.sineInOut(level);
        const isRising = level > 0.001;
        const splashY = this.waterFxSplashBaseLocalY + (this.waterFxSplashTargetLocalY - this.waterFxSplashBaseLocalY) * easedLevel + this.currentWaterIdleOffset;
        this.updateWaterVariantBlend(level);
        if (this.waterFxSplashRoot) {
            const splashPos = this.waterFxSplashRoot.position;
            this.waterFxSplashRoot.setPosition(splashPos.x, splashY, splashPos.z);
            this.waterFxSplashRoot.setScale(this.waterFxSplashBaseScale);
            for (let i = 0; i < this.waterFxSplashChildren.length; i++) {
                const state = this.waterFxSplashChildren[i];
                Tween.stopAllByTarget(state.node);
                state.node.active = true;
                const idle = this.getWaterFxIdle(i + this.waterFxJetChildren.length, isRising);
                state.node.setPosition(state.node.position.x, state.localY + idle.y, state.node.position.z);
                state.node.setScale(state.scale.x * idle.scale, state.scale.y * idle.scale, state.scale.z);
            }
        }
        if (this.waterFxJetRoot) {
            const jetPos = this.waterFxJetRoot.position;
            const jetY = this.waterFxJetBaseLocalY;
            this.waterFxJetRoot.setPosition(jetPos.x, jetY, jetPos.z);
            this.waterFxJetRoot.setScale(this.waterFxJetBaseScale);
            for (let i = 0; i < this.waterFxJetChildren.length; i++) {
                const state = this.waterFxJetChildren[i];
                Tween.stopAllByTarget(state.node);
                state.node.active = true;
                const idle = this.getWaterFxIdle(i, isRising);
                const scaleY = this.getCircleAdjustedJetScaleY(state, easedLevel, jetY, splashY) * idle.scale;
                state.node.setScale(state.scale.x, scaleY, state.scale.z);
                this.pinFxChildTop(state, scaleY, isRising ? 0 : idle.y);
            }
        }
    }

    private updateWaterVariantBlend(progress: number): void {
        if (this.waterVariantStates.length === 0) return;

        const levelCount = this.waterVariantStates.length;
        const scaled = Math.max(0, Math.min(1, progress)) * (levelCount - 1);
        const lowerIndex = Math.floor(scaled);
        const upperIndex = Math.min(levelCount - 1, lowerIndex + 1);
        const upperWeight = scaled - lowerIndex;

        for (let i = 0; i < levelCount; i++) {
            const state = this.waterVariantStates[i];
            const opacity = this.ensureOpacity(state.variant);
            Tween.stopAllByTarget(opacity);
            let weight = 0;
            if (i === lowerIndex) weight = 1 - upperWeight;
            else if (i === upperIndex) weight = upperWeight;
            opacity.opacity = Math.round(255 * weight);
            state.variant.active = weight > 0.001;
        }
    }

    private getWaterFxIdle(index: number, isRising: boolean): { y: number; scale: number } {
        const phase = this.waterFxIdleTime * WATER_FX_IDLE_SPEED + index * 0.9;
        const bobDistance = isRising ? WATER_FX_RISING_IDLE_BOB_DISTANCE : WATER_FX_IDLE_BOB_DISTANCE;
        const scaleAmount = isRising ? WATER_FX_RISING_IDLE_SCALE_AMOUNT : WATER_FX_IDLE_SCALE_AMOUNT;
        return {
            y: Math.sin(phase) * bobDistance,
            scale: 1 + Math.sin(phase + Math.PI * 0.5) * scaleAmount,
        };
    }

    private captureWaterVariants(): void {
        if (!this.waterRoot) return;

        this.waterVariantStates = [];
        for (const config of this.waterVariantConfigs) {
            const variant = this.waterRoot.getChildByName(config.variantName);
            const water = variant?.getChildByName(config.waterName) || null;
            const transform = water?.getComponent(UITransform) || null;
            if (!variant || !water || !transform) continue;

            const variantScaleY = variant.scale.y || 1;
            const waterScaleY = water.scale.y || 1;
            const topOffset = transform.contentSize.height * (1 - transform.anchorY) * Math.abs(waterScaleY * variantScaleY);
            this.waterVariantStates.push({
                variant,
                water,
                waterLocalY: water.position.y,
                variantLocalY: variant.position.y,
                variantScaleY,
                topOffset,
            });
        }

        if (this.waterVariantStates.length >= 2) {
            this.waterRiseStartTop = this.getVariantTop(this.waterVariantStates[0]);
            this.waterRiseEndTop = this.getVariantTop(this.waterVariantStates[this.waterVariantStates.length - 1]);
            this.waterRiseDistance = Math.abs(this.waterRiseEndTop - this.waterRiseStartTop);
        } else {
            this.waterRiseStartTop = 0;
            this.waterRiseEndTop = this.floodRiseHeight;
            this.waterRiseDistance = this.floodRiseHeight;
        }
    }

    private updateWaterVariantPositions(progress: number): void {
        if (this.waterVariantStates.length === 0) return;

        const eased = easing.sineInOut(Math.max(0, Math.min(1, progress)));
        this.currentWaterRiseOffset = (this.waterRiseEndTop - this.waterRiseStartTop) * eased;
        this.currentWaterIdleOffset = progress > 0.001 ? this.getRisingWaterIdleOffset() : 0;
        const currentTop = this.waterRiseStartTop + this.currentWaterRiseOffset + this.currentWaterIdleOffset;

        for (const state of this.waterVariantStates) {
            const pos = state.water.position;
            const localY = (currentTop - state.variantLocalY - state.topOffset) / state.variantScaleY;
            state.water.setPosition(pos.x, localY, pos.z);
        }
    }

    private getVariantTop(state: WaterVariantState): number {
        return state.variantLocalY + state.waterLocalY * state.variantScaleY + state.topOffset;
    }

    private getRisingWaterIdleOffset(): number {
        const period = this.idleWaterBobSeconds * 4;
        if (period <= 0) return 0;
        return Math.sin((this.waterIdleTime / period) * Math.PI * 2) * this.idleWaterBobDistance;
    }

    private getWaterRiseDistance(): number {
        return this.waterRiseDistance > 0 ? this.waterRiseDistance : this.floodRiseHeight;
    }

    private getLevelAdjustedJetScaleY(state: FxChildState, level: number): number {
        if (state.height <= 0) return state.scale.y;
        const sign = Math.sign(state.scale.y || 1);
        const baseHeight = state.height * Math.abs(state.scale.y);
        const shrinkHeight = this.getWaterRiseDistance() * level * WATER_FX_JET_RISE_FACTOR;
        return sign * Math.max(0.05, (baseHeight - shrinkHeight) / state.height);
    }

    private getCircleAdjustedJetScaleY(state: FxChildState, level: number, jetRootY: number, splashRootY: number): number {
        const fallbackScaleY = this.getLevelAdjustedJetScaleY(state, level);
        if (!this.waterFxCircleState || state.height <= 0) return fallbackScaleY;

        const sign = Math.sign(state.scale.y || 1);
        const topY = jetRootY + state.topLocalY;
        const circleY = splashRootY + this.waterFxCircleState.localY;
        const targetScaleY = sign * Math.max(0.05, (topY - circleY) / state.height);
        return Math.min(Math.abs(fallbackScaleY), Math.abs(targetScaleY)) * sign;
    }

    private pinFxChildTop(state: FxChildState, scaleY: number, yOffset = 0): void {
        const pos = state.node.position;
        if (state.height > 0) {
            const localY = state.topLocalY - this.getScaledTopOffset(state.height, state.anchorY, scaleY);
            state.node.setPosition(pos.x, localY + yOffset, pos.z);
        } else {
            state.node.setPosition(pos.x, state.localY + yOffset, pos.z);
        }
    }


    private getScaledTopOffset(height: number, anchorY: number, scaleY: number): number {
        return height * (1 - anchorY) * Math.abs(scaleY);
    }

    private fadeOutNode(node: Node, seconds: number): void {
        const opacity = this.ensureOpacity(node);
        Tween.stopAllByTarget(opacity);
        tween(opacity).to(seconds, { opacity: 0 }).call(() => node.active = false).start();
    }

    private jumpScale(node: Node, scaleMultiplier: number, seconds: number): void {
        const baseScale = node.scale.clone();
        Tween.stopAllByTarget(node);
        tween(node)
            .to(seconds * 0.5, { scale: new Vec3(baseScale.x * scaleMultiplier, baseScale.y * scaleMultiplier, baseScale.z) }, { easing: 'backOut' })
            .to(seconds * 0.5, { scale: baseScale }, { easing: 'quadOut' })
            .start();
    }

    private toLocalPosition(parent: Node, worldPosition: Vec3): Vec3 {
        const local = new Vec3();
        parent.inverseTransformPoint(local, worldPosition);
        return local;
    }

    private getOpacity(node: Node): number {
        return node.getComponent(UIOpacity)?.opacity ?? 255;
    }

    private ensureOpacity(node: Node): UIOpacity {
        return node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
    }

}
