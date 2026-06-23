import { log } from 'cc';
declare global {
    interface Window {
        LANGUAGE?: string;
    }
}

export enum LangCode {
    EN = "EN",
    DE = "DE",
    NL = "NL",
    FR = "FR",
    IT = "IT",
}

export enum LandDataParam {
    lang,

    bonus_title,
    bonus_btn,
    
    controls_go,
    
    bonus_game_play,
    bonus_game_title,
    bonus_game_btn_receive,
    bonus_game_btn_carry_on,

    push_title,
    push_subtitle,
    push_balance,
    push_time,
}

export class LangData {
    public lang: string;
    
    public bonus_title: string;
    public bonus_btn: string;
    
    public controls_go: string;
    
    public bonus_game_play: string;
    public bonus_game_title: string;
    public bonus_game_btn_receive: string;
    public bonus_game_btn_carry_on: string;
    
    public push_title: string;
    public push_subtitle: string;
    public push_balance: string;
    public push_time: string;
}


export class Localization {
    public static get CurrentLang(): LangCode { return Localization._currentLang; }
    public static get DATA(): LangData { return Localization._data; }

    private static _currentLang: LangCode;
    private static _data: LangData = null;


    public static setLanguage(lang: LangCode) {
        this._currentLang = lang;
        this._data = this.translations[this._currentLang];
    }


    public static get(param: LandDataParam): string {
        if (window.LANGUAGE) {
            try {
                this.setLanguage(LangCode[window.LANGUAGE])
            } catch(_){ log(`Language "${window.LANGUAGE}" not found`) }
        }
        const data: LangData = Localization.DATA;

        switch(param) {
            case LandDataParam.lang: return this._data.lang;
            
            case LandDataParam.bonus_title: return this._data.bonus_title;
            case LandDataParam.bonus_btn: return this._data.bonus_btn;
            
            case LandDataParam.controls_go: return this._data.controls_go;
            
            case LandDataParam.bonus_game_play: return this._data.bonus_game_play;
            case LandDataParam.bonus_game_title: return this._data.bonus_game_title;
            case LandDataParam.bonus_game_btn_receive: return this._data.bonus_game_btn_receive;
            case LandDataParam.bonus_game_btn_carry_on: return this._data.bonus_game_btn_carry_on;
            
            case LandDataParam.push_title: return this._data.push_title;
            case LandDataParam.push_subtitle: return this._data.push_subtitle;
            case LandDataParam.push_balance: return this._data.push_balance;
            case LandDataParam.push_time: return this._data.push_time;
            default: throw `NO MATCH FOR "${param}"`;
        }
    }


    private static translations: Record<LangCode, LangData> = {
        EN: {
            lang: 'EN',

            bonus_title: 'WELCOME BONUS',
            bonus_btn: 'RECEIVE',

            controls_go: 'PLAY',

            bonus_game_play: 'PLAY',
            bonus_game_title: 'YOUR EARNINGS',
            bonus_game_btn_receive: 'RECEIVE',
            bonus_game_btn_carry_on: 'CARRY ON',

            push_title: 'New Transaction',
            push_subtitle: 'VISA*7712 Transaction: 8 000 EUR',
            push_balance: 'Balance: 8 024 EUR',
            push_time: 'NOW',
        },
        DE: {
            lang: 'DE',

            bonus_title: 'Willkommensbonus',
            bonus_btn: 'Erhalten',

            controls_go: 'Los',

            bonus_game_play: 'Spielen',
            bonus_game_title: 'Ihre Einnahmen',
            bonus_game_btn_receive: 'Erhalten',
            bonus_game_btn_carry_on: 'Fortfahren',

            push_title: 'Neue Transaktion',
            push_subtitle: 'VISA*7712 Transaktion: 8.000 EUR',
            push_balance: 'Kontostand: 8.024 EUR',
            push_time: 'Jetzt',
        },
        NL: {
            lang: 'NL',

            bonus_title: 'Welkomstbonus',
            bonus_btn: 'Ontvangen',

            controls_go: 'Ga',

            bonus_game_play: 'Spelen',
            bonus_game_title: 'Uw inkomsten',
            bonus_game_btn_receive: 'Ontvangen',
            bonus_game_btn_carry_on: 'Doorgaan',

            push_title: 'Nieuwe transactie',
            push_subtitle: 'VISA*7712 transactie: 8.000 EUR',
            push_balance: 'Saldo: 8.024 EUR',
            push_time: 'Nu',
        },
        FR: {
            lang: 'FR',

            bonus_title: 'Bonus de bienvenue',
            bonus_btn: 'Recevoir',

            controls_go: 'Aller',

            bonus_game_play: 'Jouer',
            bonus_game_title: 'Vos gains',
            bonus_game_btn_receive: 'Recevoir',
            bonus_game_btn_carry_on: 'Continuer',

            push_title: 'Nouvelle transaction',
            push_subtitle: 'Transaction VISA*7712 : 8 000 EUR',
            push_balance: 'Solde : 8 024 EUR',
            push_time: 'Maintenant',
        },
        IT: {
            lang: 'IT',

            bonus_title: 'Bonus di benvenuto',
            bonus_btn: 'Ricevere',

            controls_go: 'Vai',

            bonus_game_play: 'Gioca',
            bonus_game_title: 'I tuoi guadagni',
            bonus_game_btn_receive: 'Ricevere',
            bonus_game_btn_carry_on: 'Continua',

            push_title: 'Nuova transazione',
            push_subtitle: 'Transazione VISA*7712: 8.000 EUR',
            push_balance: 'Saldo: 8.024 EUR',
            push_time: 'Ora',
        },
    };
}