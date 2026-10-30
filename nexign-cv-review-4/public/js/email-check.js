// Проверка email на форме заявки.
// Такая же проверка есть на сервере (server.js), здесь она нужна, чтобы
// человек увидел ошибку сразу, не дожидаясь ответа.

var POPULAR_DOMAINS = ["gmail.com", "mail.ru", "yandex.ru", "ya.ru", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "bk.ru", "list.ru", "inbox.ru", "rambler.ru", "nexign.com", "proton.me", "protonmail.com", "live.com", "me.com"];
var VALID_EXTRA_DOMAINS = ["yandex.com", "yandex.by", "yandex.kz", "yandex.ua", "mail.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.it", "yahoo.es", "yahoo.co.jp", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "outlook.fr", "outlook.de", "live.ru", "live.co.uk", "googlemail.com", "pm.me", "mail.ua", "ro.ru"];
var BRAND_LABELS = ["gmail", "yandex", "outlook", "hotmail", "yahoo", "icloud", "rambler", "nexign"];

// расстояние Левенштейна — сколько правок нужно, чтобы из a получить b
function levenshtein(a, b) {
  var d = [];
  for (var i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  for (var j = 1; j <= b.length; j++) {
    d[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[a.length][b.length];
}

// возвращает текст ошибки или null, если с адресом всё в порядке
function checkEmail(email) {
  if (email.length > 254) return "Email слишком длинный.";

  var m = /^([^\s@]+)@([^\s@]+)$/.exec(email);
  if (!m) return "Введите корректный email.";

  var local = m[1];
  var domain = m[2].toLowerCase();

  if (local.length > 64 || /^\.|\.$|\.\./.test(local) || !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local)) {
    return "Email содержит недопустимые символы до знака @.";
  }

  var labels = domain.split(".");
  var labelOk = function (l) {
    return l.length >= 1 && l.length <= 63 && /^[\p{L}\p{N}-]+$/u.test(l) && !l.startsWith("-") && !l.endsWith("-");
  };
  if (labels.length < 2 || !labels.every(labelOk) || !/^\p{L}{2,24}$/u.test(labels[labels.length - 1])) {
    return "Укажите корректный домен почты, например name@company.com.";
  }

  // ищем опечатки в популярных доменах: gmail.co, mail.ry и т. п.
  var known = POPULAR_DOMAINS.indexOf(domain) !== -1 || VALID_EXTRA_DOMAINS.indexOf(domain) !== -1;
  if (!known) {
    for (var k = 0; k < POPULAR_DOMAINS.length; k++) {
      var p = POPULAR_DOMAINS[k];
      var limit = p.length <= 8 ? 1 : 2;
      var sameBrand = BRAND_LABELS.indexOf(labels[0]) !== -1 && labels[0] === p.split(".")[0];
      if (sameBrand || levenshtein(domain, p) <= limit) {
        return "Похоже, в домене опечатка: «" + domain + "». Возможно, вы имели в виду " + local + "@" + p + ".";
      }
    }
  }
  return null;
}
