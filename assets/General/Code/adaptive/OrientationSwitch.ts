import { Component, screen, view } from 'cc';

export abstract class OrientationSwitch extends Component {
    private readonly applyDeferred = () => this.applyCurrentOrientation();
    private readonly applyLate = () => this.applyCurrentOrientation();
    private readonly applyFinal = () => this.applyCurrentOrientation();

    protected onLoad(): void {
        screen.on('window-resize', this.onWindowResize, this);
        screen.on('orientation-change', this.onOrientationChange, this);
        view.on('canvas-resize', this.onCanvasResize, this);

        this.applyAndCheckAgain();
    }

    protected onDestroy(): void {
        this.unschedule(this.applyDeferred);
        this.unschedule(this.applyLate);
        this.unschedule(this.applyFinal);
        screen.off('window-resize', this.onWindowResize, this);
        screen.off('orientation-change', this.onOrientationChange, this);
        view.off('canvas-resize', this.onCanvasResize, this);
    }

    protected onEnable(): void { this.applyAndCheckAgain(); }

    protected start(): void { this.applyCurrentOrientation(); }


    protected abstract applyOrientation(isPortrait: boolean): void;


    protected applyCurrentOrientation(): void {
        const size = this.getOrientationSize();
        this.applyOrientation(size.width <= size.height);
    }

    private onWindowResize() {
        this.applyAndCheckAgain();
    }

    private onOrientationChange() {
        this.applyAndCheckAgain();
    }

    private onCanvasResize() {
        this.applyAndCheckAgain();
    }

    private applyAndCheckAgain() {
        this.applyCurrentOrientation();
        this.unschedule(this.applyDeferred);
        this.unschedule(this.applyLate);
        this.unschedule(this.applyFinal);
        this.scheduleOnce(this.applyDeferred, 0.05);
        this.scheduleOnce(this.applyLate, 0.15);
        this.scheduleOnce(this.applyFinal, 0.3);
    }

    private getOrientationSize() {
        const visibleSize = view.getVisibleSize();
        if (visibleSize.width > 0 && visibleSize.height > 0) {
            return visibleSize;
        }

        const windowSize = screen.windowSize;
        if (windowSize.width > 0 && windowSize.height > 0) {
            return windowSize;
        }

        return windowSize;
    }
}
