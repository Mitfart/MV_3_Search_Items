import {
    _decorator,
    Camera,
    Component,
    EventKeyboard,
    EventTouch,
    easing,
    input,
    Input,
    KeyCode,
    Node,
    screen,
    tween,
    UITransform,
    Vec2,
    Vec3,
    view,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PlayerCameraController')
export class PlayerCameraController extends Component {
    @property({ type: Node, tooltip: 'Kept for scene compatibility. Inner gameplay nodes are not moved by this controller.' })
    public player: Node | null = null;

    @property({ type: Camera, tooltip: 'Camera used only for touch coordinate conversion. It is not moved by this controller.' })
    public camera: Camera | null = null;

    @property({ type: Node, tooltip: 'Background bounds node. Its UITransform defines camera limits.' })
    public background: Node | null = null;

    @property({ type: Node, tooltip: 'Gameplay root scaled to cover large views. Keep UI outside this node.' })
    public gameRoot: Node | null = null;

    @property({ tooltip: 'Keyboard panning speed in world units per second.' })
    public moveSpeed = 420;

    @property({ tooltip: 'Kept for scene compatibility. Camera is no longer moved.' })
    public cameraFollowSpeed = 10;

    @property({ tooltip: 'Kept for scene compatibility. Inner gameplay nodes are no longer clamped individually.' })
    public playerPadding = 40;

    @property({ tooltip: 'Touch drag strength. Finger movement is applied in the opposite direction.' })
    public dragMultiplier = 0.65;

    public dragBlocked = false;

    @property({ tooltip: 'Scale the gameplay root uniformly when it is smaller than the visible view.' })
    public scaleGameToCoverView = true;

    private readonly keyAxis = new Vec2();
    private readonly defaultRootScale = new Vec3(1, 1, 1);
    private readonly tmpRootWorld = new Vec3();
    private readonly tmpViewMin = new Vec3();
    private readonly tmpViewMax = new Vec3();
    private tutorialDragTweenTarget: { t: number } | null = null;
    private resetDragTweenTarget: { t: number } | null = null;
    private tutorialDragFrom = new Vec3();
    private tutorialDragTo = new Vec3();
    private resetDragFrom = new Vec3();
    private dragging = false;
    private defaultScaleCaptured = false;
    private lockRootAtCenter = false;

    protected onLoad(): void {
        this.captureDefaultRootScale();
    }

    protected onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        screen.on('window-resize', this.onViewChanged, this);
        screen.on('orientation-change', this.onViewChanged, this);
        view.on('canvas-resize', this.onViewChanged, this);
    }

    protected onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        screen.off('window-resize', this.onViewChanged, this);
        screen.off('orientation-change', this.onViewChanged, this);
        view.off('canvas-resize', this.onViewChanged, this);
        this.unschedule(this.applyFitAndClamp);
        this.unschedule(this.applyFitAndClampLate);
    }

    protected start(): void {
        this.fitGameToView();
        this.clampGameRootToView();
    }

    protected update(dt: number): void {
        if (this.lockRootAtCenter) {
            this.setRootToCenter();
            return;
        }
        this.moveGameRootByKeyboard(dt);
        this.clampGameRootToView();
    }

    private captureDefaultRootScale(): void {
        if (this.defaultScaleCaptured) return;
        const root = this.gameRoot || this.background;
        if (!root) return;
        this.defaultRootScale.set(root.scale);
        this.defaultScaleCaptured = true;
    }

    private onViewChanged(): void {
        this.applyFitAndClamp();
        this.unschedule(this.applyFitAndClamp);
        this.unschedule(this.applyFitAndClampLate);
        this.scheduleOnce(this.applyFitAndClamp, 0.05);
        this.scheduleOnce(this.applyFitAndClampLate, 0.2);
    }

    private applyFitAndClamp = (): void => {
        this.fitGameToView();
        if (this.lockRootAtCenter) this.setRootToCenter();
        else this.clampGameRootToView();
    };

    private applyFitAndClampLate = (): void => {
        this.fitGameToView();
        if (this.lockRootAtCenter) this.setRootToCenter();
        else this.clampGameRootToView();
    };

    private onKeyDown(event: EventKeyboard): void {
        this.lockRootAtCenter = false;
        this.setKey(event.keyCode, true);
    }

    private onKeyUp(event: EventKeyboard): void {
        this.setKey(event.keyCode, false);
    }

    private setKey(keyCode: KeyCode, pressed: boolean): void {
        const value = pressed ? 1 : 0;
        switch (keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this.keyAxis.x = -value;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this.keyAxis.x = value;
                break;
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this.keyAxis.y = value;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this.keyAxis.y = -value;
                break;
        }
    }

    private onTouchStart(): void {
        if (!this.dragBlocked) this.lockRootAtCenter = false;
        this.dragging = !this.dragBlocked;
    }

    private onTouchMove(event: EventTouch): void {
        const root = this.gameRoot || this.background;
        if (this.dragBlocked || !this.dragging || !root) return;

        const delta = event.getUIDelta();
        root.getWorldPosition(this.tmpRootWorld);
        this.tmpRootWorld.x += delta.x * this.dragMultiplier;
        this.tmpRootWorld.y += delta.y * this.dragMultiplier;
        root.setWorldPosition(this.tmpRootWorld);
        this.clampGameRootToView();
    }

    private onTouchEnd(): void {
        this.dragging = false;
    }

    public resetDragToDefault(duration = 0.35): void {
        const root = this.gameRoot || this.background;
        if (!root) return;

        this.lockRootAtCenter = true;
        this.dragBlocked = true;
        this.dragging = false;
        this.keyAxis.set(0, 0);
        if (this.tutorialDragTweenTarget) {
            tween(this.tutorialDragTweenTarget).stop();
            this.tutorialDragTweenTarget = null;
        }
        if (this.resetDragTweenTarget) tween(this.resetDragTweenTarget).stop();

        this.resetDragFrom.set(root.position);
        this.resetDragTweenTarget = { t: 0 };
        tween(this.resetDragTweenTarget)
            .to(duration, { t: 1 }, { easing: easing.sineInOut, onUpdate: (target?: { t: number }) => this.updateResetDrag(root, target?.t ?? 1) })
            .call(() => {
                this.setRootToCenter();
                this.resetDragTweenTarget = null;
            })
            .start();
    }

    private updateResetDrag(root: Node, t: number): void {
        root.setPosition(
            this.resetDragFrom.x * (1 - t),
            this.resetDragFrom.y * (1 - t),
            this.resetDragFrom.z,
        );
        this.setCameraToCenter();
    }

    private setRootToCenter(): void {
        const root = this.gameRoot || this.background;
        if (root) root.setPosition(0, 0, root.position.z);
        this.setCameraToCenter();
    }

    private setCameraToCenter(): void {
        const cameraNode = this.camera?.node;
        if (cameraNode) cameraNode.setPosition(0, 0, cameraNode.position.z);
    }

    public playTutorialDrag(duration: number, distance: number): void {
        const root = this.gameRoot || this.background;
        if (!root) return;

        if (this.tutorialDragTweenTarget) {
            tween(this.tutorialDragTweenTarget).stop();
            this.tutorialDragTweenTarget = null;
        }

        root.getWorldPosition(this.tutorialDragFrom);
        this.tutorialDragTo.set(this.tutorialDragFrom);
        if (this.isLandscapeView()) this.tutorialDragTo.y -= distance * this.dragMultiplier;
        else this.tutorialDragTo.x -= distance * this.dragMultiplier;

        this.tutorialDragTweenTarget = { t: 0 };
        tween(this.tutorialDragTweenTarget)
            .to(duration * 0.5, { t: 1 }, { easing: easing.sineInOut, onUpdate: (target?: { t: number }) => this.updateTutorialDrag(root, target?.t ?? 1) })
            .to(duration * 0.5, { t: 0 }, { easing: easing.sineInOut, onUpdate: (target?: { t: number }) => this.updateTutorialDrag(root, target?.t ?? 0) })
            .call(() => this.tutorialDragTweenTarget = null)
            .start();
    }

    private updateTutorialDrag(root: Node, t: number): void {
        root.setWorldPosition(
            this.tutorialDragFrom.x + (this.tutorialDragTo.x - this.tutorialDragFrom.x) * t,
            this.tutorialDragFrom.y + (this.tutorialDragTo.y - this.tutorialDragFrom.y) * t,
            this.tutorialDragFrom.z,
        );
        this.clampGameRootToView();
    }

    public isLandscapeView(): boolean {
        return !this.isPortraitView();
    }

    public isWorldPositionVisible(worldPosition: Readonly<Vec3>): boolean {
        const bounds = this.getVisibleWorldBounds();
        return worldPosition.x >= bounds.minX
            && worldPosition.x <= bounds.maxX
            && worldPosition.y >= bounds.minY
            && worldPosition.y <= bounds.maxY;
    }

    private moveGameRootByKeyboard(dt: number): void {
        const root = this.gameRoot || this.background;
        if (!root || this.keyAxis.lengthSqr() <= 0) return;
        const axis = this.keyAxis.clone().normalize();
        root.getWorldPosition(this.tmpRootWorld);
        this.tmpRootWorld.x -= axis.x * this.moveSpeed * dt;
        this.tmpRootWorld.y -= axis.y * this.moveSpeed * dt;
        root.setWorldPosition(this.tmpRootWorld);
    }

    private fitGameToView(): void {
        const root = this.gameRoot || this.background;
        if (!root) return;
        this.captureDefaultRootScale();

        root.setScale(this.defaultRootScale);

        if (!this.scaleGameToCoverView || !this.background || this.isPortraitView()) return;

        const bounds = this.getBackgroundBounds();
        if (!bounds) return;

        const viewBounds = this.getVisibleWorldBounds();
        const viewWidth = viewBounds.maxX - viewBounds.minX;
        const viewHeight = viewBounds.maxY - viewBounds.minY;
        const boundsWidth = bounds.maxX - bounds.minX;
        const boundsHeight = bounds.maxY - bounds.minY;
        if (viewWidth <= 0 || viewHeight <= 0 || boundsWidth <= 0 || boundsHeight <= 0) return;

        const currentScale = root.scale;
        const requiredMultiplier = Math.max(1, viewWidth / boundsWidth, viewHeight / boundsHeight);
        if (requiredMultiplier <= 1.001) return;

        root.setScale(
            currentScale.x * requiredMultiplier,
            currentScale.y * requiredMultiplier,
            currentScale.z,
        );
    }

    private clampGameRootToView(): void {
        const root = this.gameRoot || this.background;
        const bounds = this.getBackgroundBounds();
        if (!root || !bounds) return;

        const viewBounds = this.getVisibleWorldBounds();
        const viewMinX = viewBounds.minX;
        const viewMaxX = viewBounds.maxX;
        const viewMinY = viewBounds.minY;
        const viewMaxY = viewBounds.maxY;
        const viewWidth = viewMaxX - viewMinX;
        const viewHeight = viewMaxY - viewMinY;
        const boundsWidth = bounds.maxX - bounds.minX;
        const boundsHeight = bounds.maxY - bounds.minY;

        root.getWorldPosition(this.tmpRootWorld);

        if (boundsWidth <= viewWidth) {
            this.tmpRootWorld.x += (viewMinX + viewMaxX - bounds.minX - bounds.maxX) * 0.5;
        } else if (bounds.minX > viewMinX) {
            this.tmpRootWorld.x += viewMinX - bounds.minX;
        } else if (bounds.maxX < viewMaxX) {
            this.tmpRootWorld.x += viewMaxX - bounds.maxX;
        }

        if (boundsHeight <= viewHeight) {
            this.tmpRootWorld.y += (viewMinY + viewMaxY - bounds.minY - bounds.maxY) * 0.5;
        } else if (bounds.minY > viewMinY) {
            this.tmpRootWorld.y += viewMinY - bounds.minY;
        } else if (bounds.maxY < viewMaxY) {
            this.tmpRootWorld.y += viewMaxY - bounds.maxY;
        }

        root.setWorldPosition(this.tmpRootWorld);
    }

    private isPortraitView(): boolean {
        const size = screen.windowSize || view.getVisibleSize();
        return size.width <= size.height;
    }

    private getVisibleWorldBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        const visible = view.getVisibleSize();
        const root = this.gameRoot || this.background;
        const parent = root?.parent || null;

        if (parent) {
            const pos = parent.worldPosition;
            const scale = parent.worldScale;
            const width = visible.width * Math.abs(scale.x);
            const height = visible.height * Math.abs(scale.y);

            return {
                minX: pos.x - width * 0.5,
                maxX: pos.x + width * 0.5,
                minY: pos.y - height * 0.5,
                maxY: pos.y + height * 0.5,
            };
        }

        this.tmpViewMin.set(0, 0, 0);
        this.tmpViewMax.set(visible.width, visible.height, 0);

        if (this.camera) {
            this.tmpViewMin = this.camera.screenToWorld(this.tmpViewMin);
            this.tmpViewMax = this.camera.screenToWorld(this.tmpViewMax);
        }

        return {
            minX: Math.min(this.tmpViewMin.x, this.tmpViewMax.x),
            maxX: Math.max(this.tmpViewMin.x, this.tmpViewMax.x),
            minY: Math.min(this.tmpViewMin.y, this.tmpViewMax.y),
            maxY: Math.max(this.tmpViewMin.y, this.tmpViewMax.y),
        };
    }

    private getBackgroundBounds(): { minX: number; maxX: number; minY: number; maxY: number } | null {
        if (!this.background) return null;
        const transform = this.background.getComponent(UITransform);
        if (!transform) return null;

        const width = transform.contentSize.width * Math.abs(this.background.worldScale.x);
        const height = transform.contentSize.height * Math.abs(this.background.worldScale.y);
        const anchor = transform.anchorPoint;
        const pos = this.background.worldPosition;

        return {
            minX: pos.x - width * anchor.x,
            maxX: pos.x + width * (1 - anchor.x),
            minY: pos.y - height * anchor.y,
            maxY: pos.y + height * (1 - anchor.y),
        };
    }

    private uiToWorld(ui: Vec2): Vec3 {
        if (this.camera) {
            return this.camera.screenToWorld(new Vec3(ui.x, ui.y, 0));
        }
        return new Vec3(ui.x, ui.y, 0);
    }
}
