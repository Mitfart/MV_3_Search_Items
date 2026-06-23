import { EventTarget } from 'cc';

export enum ScoreEventType {
    SCORE_CHANGED = "score_changed",
    BONUS_CHANGED = "bonus_changed",
}

export class Score {
    public static readonly EventType: typeof ScoreEventType = ScoreEventType;
    public static readonly Events: EventTarget = new EventTarget();

    private static _score: number = 0;
    private static _bonus: number = 0;


    public static get(): number {
        return Score._score;
    }

    public static set(value: number) {
        Score.Events.emit(Score.EventType.SCORE_CHANGED, Score._score, value);

        Score._score = value;
    }

    public static add(value: number) {
        Score.set(Score._score + value);
    }
    


    public static getBonus(): number {
        return Score._bonus;
    }

    public static setBonus(value: number) {
        Score.Events.emit(Score.EventType.BONUS_CHANGED, Score._bonus, value);

        Score._bonus = value;
    }

    public static addBonus(value: number) {
        Score.setBonus(Score._bonus + value);
    }
}