import Vue from "vue";
import VueI18n from "vue-i18n";
import Languages from "./lang/languages";

class Language {
    static load(locale) {
        return require(`./lang/${Language.current(locale)}.json`);
    }

    static current(locale) {
        if ((!locale || locale === "") && navigator && (navigator.language || navigator.userLanguage)) {
            locale = navigator.language || navigator.userLanguage;
        }

        if (!locale || locale === "") {
            locale = "en";
        }

        return Language.supported(Languages[locale]);
    }

    static supported(locale) {
        switch (locale) {
            case "ar":
            case "bg":
            case "cs":
            case "de":
            case "el":
            case "en":
            case "es":
            case "fr":
            case "he":
            case "it":
            case "ja":
            case "ko":
            case "nl":
            case "no":
            case "pl":
            case "pt":
            case "ro":
            case "ru":
            case "vi":
            case "zh":
                return locale;

            default:
                return "en";
        }
    }
}

Vue.use(VueI18n);

export default function (locale) {
    return new VueI18n({
        locale: Language.current(locale),
        messages: Language.load(locale)
    });
}
