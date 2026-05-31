(function () {
    'use strict';
    function startPlugin() {
        function isUkrainian(movie) {
            if (!movie) return false;
            var title = (movie.title || movie.name || '').toLowerCase();
            var overview = (movie.overview || '').toLowerCase();
            var lang = (movie.original_language || '').toLowerCase();
            if (lang === 'uk' || lang === 'ua') return true;
            var hasUkrLetters = /[іїєґІЇЄҐ]/.test(overview + ' ' + title);
            var hasUkrTags = /ukr|ua|ukrainian|украї|укр/i.test(title + ' ' + overview);
            if (hasUkrLetters || hasUkrTags) return true;
            if (!overview || overview.length < 10 || /^[a-zA-Z0-9\s,.:;!?#%&*()-_=+]*$/.test(overview)) return false;
            if (/[а-я]/i.test(overview) && !hasUkrLetters) return false;
            return true;
        }
        Lampa.Hooks.add('component_create', function (object) {
            if (object.component === 'main' || object.component === 'category') {
                if (object.instance && object.instance.append) {
                    var originalAppend = object.instance.append;
                    object.instance.append = function (data) {
                        if (data && data.items && data.items.length) {
                            data.items = data.items.filter(function (movie) { return isUkrainian(movie); });
                        }
                        return originalAppend.call(object.instance, data);
                    };
                }
            }
        });
        if (window.Lampa && Lampa.Card) {
            var originalCardInit = Lampa.Card.prototype.init;
            Lampa.Card.prototype.init = function (data) {
                if (!isUkrainian(data)) data.hide_card = true;
                originalCardInit.call(this, data);
                if (data.hide_card && this.render) {
                    var cardElement = this.render();
                    if (cardElement && cardElement.css) cardElement.css('display', 'none');
                }
            };
        }
    }
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();
