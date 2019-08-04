import Vue from "vue";
import VueI18n from "vue-i18n";
import Config from "../etc/config.json";
import Languages from "./lang/languages";

class Language {
    static load() {
        return require(`./lang/${Language.current}.json`);
    }

    static get current() {
        let locale = Config.client.locale;

        if ((!locale || locale === "") && navigator && (navigator.language || navigator.userLanguage)) {
            locale = navigator.language || navigator.userLanguage;
        }

        if (!locale || locale === "") {
            locale = "en";
        }

        return Language.supported(Languages[locale]);
    }

    static supported(lang) {
        switch (lang) {
            case "en":
            case "es":
            case "ro":
                return lang;

            default:
                return "en";
        }
    }
}

Vue.use(VueI18n);

export default new VueI18n({
    locale: Language.current,
    messages: Language.load()
});
