(function () {
    'use strict';

    function initUkrVoiceFilter() {
        console.log('UkrVoiceFilter: Запущено логіку Боді з фільтрацією за озвучкою.');

        // Головна функція перевірки звуку
        function hasNoUkrainianVoice(data) {
            if (!data) return true;

            // Якщо фільм виробництва України або мова оригінальна українська — залишаємо
            var lang = (data.original_language || '').toLowerCase();
            if (lang === 'uk' || lang === 'ua') return false;

            // 1. Перевіряємо вбудовані мітки озвучки, які CUB передає разом із карткою
            // Скануємо всі текстові поля об'єкта, де балансери пишуть мову звуку (перекладу)
            var checkString = '';
            
            if (data.translation) checkString += ' ' + data.translation;
            if (data.translations && data.translations.length) checkString += ' ' + data.translations.join(' ');
            if (data.sound) checkString += ' ' + data.sound;
            if (data.quality) checkString += ' ' + data.quality;
            if (data.streams) checkString += ' ' + JSON.stringify(data.streams);
            
            // Також перевіряємо назву — іноді туди вшивають тег [Ukr] або [Дубляж]
            var title = (data.title || data.name || '').toLowerCase();
            checkString = (checkString + ' ' + title).toLowerCase();

            // Шукаємо прямі маркери наявності української звукової доріжки
            var hasUkrVoice = /ukr|ua|ukrainian|украї|дубляж|укр/i.test(checkString);

            if (hasUkrVoice) {
                return false; // Озвучка є, фільм залишаємо
            }

            // 2. Якщо в об'єкті картки взагалі немає жодних даних про український звук —
            // це означає, що релізу з українською озвучкою в базі CUB для цього фільму ще немає. Ховаємо.
            return true; 
        }

        // КАРКАС БОДІ: Перехоплюємо ініціалізацію кожної картки (Card)
        if (window.Lampa && Lampa.Card) {
            var originalCardInit = Lampa.Card.prototype.init;
            
            Lampa.Card.prototype.init = function (data) {
                // Якщо немає української озвучки в даних — маркуємо картку на приховування
                if (hasNoUkrainianVoice(data)) {
                    data.hide_card = true; 
                }

                // Запускаємо базовий рендерер Lampa
                originalCardInit.call(this, data);

                // ОДИН В ОДИН ЯК У БОДІ: Якщо мітка активна, повністю стираємо елемент з екрана
                if (data.hide_card && this.render) {
                    var element = this.render();
                    if (element && element.remove) {
                        element.remove(); // Фізично видаляємо постер з сітки на Samsung Tizen
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
