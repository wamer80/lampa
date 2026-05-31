(function () {
    'use strict';

    function startUkrVoiceFilter() {
        console.log('UkrVoiceFilter: Модуль перевірки наявності озвучки запущено.');

        // Функція, яка заглядає в онлайн-плеєр та шукає український звук
        function hasNoUkrainianVoice(movie, callback) {
            if (!movie) return callback(true);

            // Якщо фільм оригінально український — залишаємо без перевірок
            if (movie.original_language === 'uk' || movie.original_language === 'ua') {
                return callback(false);
            }

            var id = movie.id;
            var type = movie.number_of_seasons ? 'tv' : 'movie';

            // Робимо фоновий запит до універсального онлайн-парсеру Lampa
            Lampa.Background.fetch({
                url: 'https://cub.watch' + id + '&type=' + type
            }, function (response) {
                if (response && response.data) {
                    // Перетворюємо всі дані про доступні озвучки та переклади в один рядок
                    var allVoices = JSON.stringify(response.data).toLowerCase();
                    
                    // Шукаємо прямі маркери українського звуку
                    var hasVoice = /ukr|ua|ukrainian|украї|дубляж/i.test(allVoices);
                    
                    if (hasVoice) {
                        return callback(false); // Звук є, ховати не потрібно
                    }
                }
                callback(true); // Української озвучки немає — ховаємо картку
            }, function () {
                // Якщо сервер онлайн-балансерів тимчасово не відповів, залишаємо картку
                callback(false);
            });
        }

        // Перехоплюємо рендеринг кожної картки (постера) на екрані Samsung Tizen
        if (window.Lampa && Lampa.Card) {
            var originalCardInit = Lampa.Card.prototype.init;
            
            Lampa.Card.prototype.init = function (data) {
                var self = this;
                originalCardInit.call(this, data);

                // Запускаємо фонову перевірку озвучки для цієї картки
                hasNoUkrainianVoice(data, function (shouldHide) {
                    if (shouldHide && self.render) {
                        var element = self.render();
                        if (element) {
                            // Повністю видаляємо постер з екрана телевізора, якщо немає укр озвучки
                            if (element.remove) element.remove();
                            else if (element.css) element.css('display', 'none');
                        }
                    }
                });
            };
        }
    }

    if (window.appready) {
        startUkrVoiceFilter();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startUkrVoiceFilter();
        });
    }
})();
