(function () {
    'use strict';

    function startPlugin() {
        console.log('UkrVoiceFilter: Запущено перевірку реальної наявності озвучки.');

        // Функція фонової перевірки наявності укр озвучки через балансери Lampa
        function checkUkrainianVoice(movie, callback) {
            if (!movie) return callback(false);

            // Якщо фільм суто український — залишаємо без перевірок
            if (movie.original_language === 'uk' || movie.original_language === 'ua') {
                return callback(true);
            }

            // Формуємо пошуковий запит до вбудованого онлайн-модуля Lampa (наприклад, Rezka/CUB)
            var id = movie.id;
            var type = movie.number_of_seasons ? 'tv' : 'movie';
            
            // Використовуємо універсальний внутрішній метод Lampa для запиту до кінотеатрів
            Lampa.Background.fetch({
                url: 'https://cub.watch' + id + '&type=' + type
            }, function (response) {
                if (response && response.data) {
                    var strData = JSON.stringify(response.data).toLowerCase();
                    
                    // Перевіряємо, чи є в потоках та озвучках згадка про Україну
                    var hasUkrVoice = /ukr|ua|ukrainian|украї|дубляж|ua-ix/i.test(strData);
                    
                    if (hasUkrVoice) {
                        return callback(true);
                    }
                }
                callback(false); // Якщо в онлайн-джерелах немає укр звуку — ховаємо
            }, function () {
                // Якщо сервер не відповів, залишаємо картку про всяк випадок
                callback(true);
            });
        }

        // Перехоплення та приховування карток на етапі рендерингу сітки
        if (window.Lampa && Lampa.Card) {
            var originalCardInit = Lampa.Card.prototype.init;
            
            Lampa.Card.prototype.init = function (data) {
                var self = this;
                
                originalCardInit.call(this, data);

                // Запускаємо перевірку звуку для кожного постера на головній
                checkUkrainianVoice(data, function (isAvailable) {
                    if (!isAvailable && self.render) {
                        var cardElement = self.render();
                        if (cardElement && cardElement.css) {
                            cardElement.css('display', 'none'); // Фізично видаляємо постер з екрану Tizen
                        }
                    }
                });
            };
        }
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
