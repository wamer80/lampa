(function () {
    'use strict';

    function initLampaUaFilter() {
        console.log('LampaUaFilter: Модуль синхронної фільтрації стрічок запущено.');

        // Функція жорсткої перевірки картки за текстовими маркерами
        function isNotUkrainian(item) {
            if (!item) return true;

            var title = (item.title || item.name || '').toLowerCase();
            var overview = (item.overview || '').toLowerCase();
            var lang = (item.original_language || '').toLowerCase();

            // 1. Якщо оригінальна мова українська — фільм стовідсотково наш
            if (lang === 'uk' || lang === 'ua') return false;

            // 2. Шукаємо специфічні українські літери (і, ї, є, ґ) або прямі текстові теги
            var hasUkrSpecific = /[іїєґІЇЄҐ]/.test(overview + ' ' + title);
            var hasUkrTags = /ukr|ua|ukrainian|украї|укр/i.test(title + ' ' + overview);

            if (hasUkrSpecific || hasUkrTags) return false;

            // 3. Якщо опис містить російські літери-маркери (ё, ы, ъ, э) — ховаємо безжально
            if (/[ёыъэ]/i.test(overview)) return true;

            // 4. Якщо опис суто російський (кирилиця без жодної української літери) — ховаємо,
            // щоб на головній не висіли релізи, які ще не перекладені українською спільнотою
            if (/[а-я]/i.test(overview) && !hasUkrSpecific) return true;

            // 5. Якщо опис повністю англійською мовою (латиниця) або пустий — фільм ще не вийшов в Україні
            if (!overview || overview.length < 15 || /^[a-zA-Z0-9\s,.:;!?#%&*()-_=+]*$/.test(overview)) return true;

            return false;
        }

        // Перехоплення та миттєва фільтрація потоку даних з CUB / TMDB
        Lampa.Hooks.add('component_create', function (object) {
            if (object.component === 'main' || object.component === 'category') {
                if (object.instance && object.instance.append) {
                    var originalAppend = object.instance.append;

                    object.instance.append = function (data) {
                        if (data && data.items && data.items.length) {
                            // Залишаємо у масиві тільки те, що пройшло перевірку
                            data.items = data.items.filter(function (movie) {
                                return !isNotUkrainian(movie);
                            });
                        }
                        return originalAppend.call(object.instance, data);
                    };
                }
            }
        });

        // Пряме видалення постерів з екрана, якщо вони проскочили початковий хук
        if (window.Lampa && Lampa.Card) {
            var originalCardInit = Lampa.Card.prototype.init;
            
            Lampa.Card.prototype.init = function (data) {
                if (isNotUkrainian(data)) {
                    data.hide_card = true;
                }

                originalCardInit.call(this, data);

                if (data.hide_card && this.render) {
                    var element = this.render();
                    if (element) {
                        if (element.remove) element.remove();
                        else if (element.css) element.css('display', 'none');
                    }
                }
            };
        }
    }

    if (window.appready) {
        initLampaUaFilter();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initLampaUaFilter();
        });
    }
})();
