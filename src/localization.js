/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

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
            case "sv":
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
