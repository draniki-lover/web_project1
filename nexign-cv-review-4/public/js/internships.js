// список стажировок: фильтр по вкладкам и кнопка «Смотреть больше»

var JOBS = [
  { cat: "Техническое сопровождение", city: "Санкт-Петербург", title: "Стажер в отдел поддержки продаж (направление HR)", text: "Мы ищем специалиста поддержки продаж, который будет участвовать в presale-проектах в роли технического менеджера по направлению HRM. Требуются…" },
  { cat: "Техническое сопровождение", city: "Санкт-Петербург", title: "Стажер в отдел разработки", text: "Мы ищем начинающего разработчика, который будет участвовать в создании внутренних сервисов и клиентских веб-приложений. Требуются базовые знания JavaScript и…" },
  { cat: "Менеджмент", city: "Санкт-Петербург, Москва", title: "Стажер менеджер отчётности по устойчивому развитию", text: "Наша команда работает над тем, чтобы снизить экологическое воздействие, и создаёт экологические продукты для B2B- и B2C-аудитории. Заполняйте…" },
  { cat: "Развитие бизнеса", city: "Санкт-Петербург, Москва", title: "Стажер-аналитик по развитию бизнеса", text: "Наша команда помогает компаниям находить новые рынки и точки роста. Стажер будет собирать и анализировать данные, готовить обзоры конкурентов и участвовать в…" },
  { cat: "Менеджмент", city: "Санкт-Петербург", title: "Стажер-координатор проектов", text: "Мы ищем организованного помощника руководителя проектов, который будет участвовать в планировании задач, следить за сроками и сопровождать коммуникацию между командой и заказчиками. Требуется…" },
  { cat: "Развитие бизнеса", city: "Москва", title: "Стажер по партнёрским программам", text: "Поможешь развивать сеть партнёров: подготовка коммерческих предложений, ведение CRM и участие в переговорах вместе с опытными коллегами." },
  { cat: "Техническое сопровождение", city: "Санкт-Петербург, Новосибирск", title: "Стажер службы технической поддержки", text: "Будешь принимать обращения клиентов, разбираться в причинах сбоев и вместе с инженерами находить решения. Подойдёт, если любишь разбираться в технике." },
  { cat: "Менеджмент", city: "Москва", title: "Стажер в отдел продуктового менеджмента", text: "Поможешь собирать требования, описывать пользовательские сценарии и следить за запуском новых функций продукта." }
];

var SHOWN_BY_DEFAULT = 5;

var cardsBox = document.getElementById("cards");
var tabs = document.querySelectorAll(".tab");
var currentFilter = "all";
var showAll = false;

function renderCards() {
  var list = JOBS.filter(function (job) {
    return currentFilter === "all" || job.cat === currentFilter;
  });
  var visible = showAll ? list : list.slice(0, SHOWN_BY_DEFAULT);

  cardsBox.innerHTML = "";

  visible.forEach(function (job) {
    var card = document.createElement("a");
    card.className = "card";
    // при отклике сразу подставляем направление в форму
    card.href = "apply.html?dir=" + encodeURIComponent(job.cat);
    card.innerHTML =
      '<span class="city">' + job.city + "</span>" +
      "<h3>" + job.title + "</h3>" +
      "<p>" + job.text + "</p>" +
      '<span class="go">Откликнуться →</span>';
    cardsBox.appendChild(card);
  });

  if (!showAll && list.length > SHOWN_BY_DEFAULT) {
    var more = document.createElement("button");
    more.type = "button";
    more.className = "card card-more";
    more.innerHTML = 'Смотреть больше<img src="img/arrow-down.svg" alt="">';
    more.addEventListener("click", function () {
      showAll = true;
      renderCards();
    });
    cardsBox.appendChild(more);
  }
}

tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    tabs.forEach(function (t) { t.classList.remove("active"); });
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    showAll = false;
    renderCards();
  });
});

renderCards();
