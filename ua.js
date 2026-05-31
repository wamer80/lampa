(function () {
    'use strict';

    function initUkrVoiceFilter() {
        console.log('UkrVoiceFilter: Активовано жорстку фільтрацію постерів.');

        // Функція перевірки контенту
        function hasNoUkrVoice(data) {
            if (!data) return true;

            var title = (data.title || data.name || '').toLowerCase();
            var overview = (data.overview || '').toLowerCase();
            var lang = (data.original_language || '').toLowerCase();

            // Якщо фільм виробництва України або рідна мова українська — залишаємо
            if (lang === 'uk' || lang === 'ua') return false;

            // Перевіряємо текстові мітки та теги якості/перекладу, які приходять у картці
            var hasUkrTags = /ukr|ua|ukrainian|украї|укр|дубляж/i.test(title + ' ' + overview);
            var hasUkrLetters = /[іїєґІЇЄҐ]/.test(overview + ' ' + title);

            if (hasUkrTags || hasUkrLetters) return false;

            // Якщо опис містить російські літери (ё, ы, ъ, э) або звичайну кирилицю БЕЗ укр-літер — ховаємо
            if (/[а-яёыъэ]/i.test(overview) && !hasUkrLetters) return true;

            // Якщо опис англійський або пустий (немає релізу в Україні) — ховаємо
            if (!overview || overview.length < 15 || /^[a-zA-Z0-9\s,.:;!?#%&*()-_=+]*$/.test(overview)) return true;

            return false;
        }

        // 1. Перехоплення на етапі створення стрічок на головній
        Lampa.Hooks.add('component_create', function (object) {
            if (object.component === 'main' || object.component === 'category') {
                if (object.instance && object.instance.append) {
                    var originalAppend = object.instance.append;

                    object.instance.append = function (data) {
                        if (data && data.items && data.items.length) {
                            // Фільтруємо масив, прибираючи все, де немає укр озвучки/тегів
                            data.items = data.items.filter(function (movie) {
                                return !hasNoUkrVoice(movie);
                            });
                        }
                        return originalAppend.call(object.instance, data);
                    };
                }
            }
        });

        // 2. Жорстке видалення з екрана, якщо картка намагається відмалюватися
        if (window.Lampa && Lampa.Card) {
            var originalCardInit = Lampa.Card.prototype.init;
            
            Lampa.Card.prototype.init = function (data) {
                if (hasNoUkrVoice(data)) {
                    data.hide_card = true;
                }

                originalCardInit.call(this, data);

                // Якщо активовано прапор приховування, повністю видаляємо елемент з екрана ТБ
                if (data.hide_card && this.render) {
                    var element = this.render();
                    if (element && element.remove) {
                        element.remove(); // Повне видалення з коду сторінки
                    } else if (element && element.css) {
                        element.css('display', 'none');
                    }
                }
            };
        }
    }

    if (window.appready) {
        initUkrVoiceFilter();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initUkrVoiceFilter();
        });
    }
})();
