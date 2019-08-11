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
            case "en":
            case "es":
            case "ro":
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
