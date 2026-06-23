import { EventTarget } from 'cc';

export enum ScoreEventType {
    ScoreChanged = 'score_changed',
    BonusChanged = 'bonus_changed',
    SCORE_CHANGED = 'score_changed',
    BONUS_CHANGED = 'bonus_changed',
}

export class Score {
    public static readonly EventType = ScoreEventType;
    public static readonly Events = new EventTarget();

    private static score = 0;
    private static bonus = 0;

    public static get(): number {
        return Score.score;
    }

    public static set(value: number): void {
        Score.Events.emit(Score.EventType.ScoreChanged, Score.score, value);
        Score.score = value;
    }

    public static add(value: number): void {
        Score.set(Score.score + value);
    }

    public static getBonus(): number {
        return Score.bonus;
    }

    public static setBonus(value: number): void {
        Score.Events.emit(Score.EventType.BonusChanged, Score.bonus, value);
        Score.bonus = value;
    }

    public static addBonus(value: number): void {
        Score.setBonus(Score.bonus + value);
    }
}
