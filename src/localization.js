import Vue from "vue";
import VueI18n from "vue-i18n";
import Config from "../etc/config.json";
import Languages from "./lang/languages";

class Language {
    static load() {
        return require(`./lang/${Language.current}.json`);
    }

    static get current() {
        return Language.supported(Languages[Config.client.locale || (navigator.language || navigator.userLanguage).toLowerCase()] || "en");
    }

    static supported = (lang) => {
        switch (lang) {
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
