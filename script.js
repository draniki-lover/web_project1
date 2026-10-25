/* Данные */

const DIRECTIONS = [
  "Менеджмент",
  "Развитие бизнеса",
  "Техническое сопровождение"
];

const JOBS = [
  {
    cat: "Техническое сопровождение",
    city: "Санкт-Петербург",
    title: "Стажер в отдел поддержки продаж (направление HR)",
    text:
      "Мы ищем специалиста поддержки продаж, который будет участвовать " +
      "в presale-проектах в роли технического менеджера по направлению HRM. " +
      "Требуются…"
  },
  {
    cat: "Техническое сопровождение",
    city: "Санкт-Петербург",
    title: "Стажер в отдел разработки",
    text:
      "Мы ищем начинающего разработчика, который будет участвовать в " +
      "создании внутренних сервисов и клиентских веб-приложений. " +
      "Требуются базовые знания JavaScript и…"
  },
  {
    cat: "Менеджмент",
    city: "Санкт-Петербург, Москва",
    title: "Стажер менеджер отчётности по устойчивому развитию",
    text:
      "Наша команда работает над тем, чтобы снизить экологическое " +
      "воздействие, и создаёт экологические продукты для B2B- и " +
      "B2C-аудитории. Заполняйте…"
  },
  {
    cat: "Развитие бизнеса",
    city: "Санкт-Петербург, Москва",
    title: "Стажер-аналитик по развитию бизнеса",
    text:
      "Наша команда помогает компаниям находить новые рынки и точки " +
      "роста. Стажер будет собирать и анализировать данные, готовить " +
      "обзоры конкурентов и участвовать в…"
  },
  {
    cat: "Менеджмент",
    city: "Санкт-Петербург",
    title: "Стажер-координатор проектов",
    text:
      "Мы ищем организованного помощника руководителя проектов, " +
      "который будет участвовать в планировании задач, следить за " +
      "сроками и сопровождать коммуникацию между командой и " +
      "заказчиками. Требуется…"
  },
  {
    cat: "Развитие бизнеса",
    city: "Москва",
    title: "Стажер по партнёрским программам",
    text:
      "Поможешь развивать сеть партнёров: подготовка коммерческих " +
      "предложений, ведение CRM и участие в переговорах вместе с " +
      "опытными коллегами."
  },
  {
    cat: "Техническое сопровождение",
    city: "Санкт-Петербург, Новосибирск",
    title: "Стажер службы технической поддержки",
    text:
      "Будешь принимать обращения клиентов, разбираться в причинах " +
      "сбоев и совместно с инженерами находить решения. Подойдёт, " +
      "если любишь разбираться в технике."
  },
  {
    cat: "Менеджмент",
    city: "Москва",
    title: "Стажер в отдел продуктового менеджмента",
    text:
      "Поможешь собирать требования, описывать пользовательские " +
      "сценарии и следить за запуском новых функций продукта."
  }
];

const VISIBLE_DEFAULT = 5;

/* Переключение страниц */

const pages = {
  home: "home",
  apply: "apply",
  internships: "internships",
  success: "success",
  guide: "guide"
};

function route() {
  let h = location.hash.replace(/^#\/?/, "") || "home";
  let target = h;

  if (h === "about" || h === "") {
    target = "home";
  }

  if (!pages[target]) {
    target = "home";
  }

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle(
      "active",
      page.dataset.page === target
    );
  });

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle(
      "active",
      link.dataset.nav === h
    );
  });

  document.getElementById("menu").classList.remove("open");

  if (h === "about") {
    setTimeout(() => {
      document.getElementById("about").scrollIntoView({
        behavior: "smooth"
      });
    }, 30);
  } else {
    window.scrollTo({ top: 0 });
  }
}

window.addEventListener("hashchange", route);

/* Мобильное меню */

document.getElementById("burger").onclick = () => {
  document.getElementById("menu").classList.toggle("open");
};

/* Вопросы и ответы */

document.querySelectorAll(".faq-q").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.parentElement;
    const wasOpen = item.classList.contains("open");

    document.querySelectorAll(".faq-item").forEach((faqItem) => {
      faqItem.classList.remove("open");
    });

    if (!wasOpen) {
      item.classList.add("open");
    }
  });
});

/* Стажировки */

let filter = "all";
let expanded = false;

const cardsEl = document.getElementById("cards");

function renderCards() {
  const list = JOBS.filter((job) => {
    return filter === "all" || job.cat === filter;
  });

  const shown = expanded
    ? list
    : list.slice(0, VISIBLE_DEFAULT);

  cardsEl.innerHTML = "";

  shown.forEach((job) => {
    const button = document.createElement("button");

    button.className = "card";

    button.innerHTML = `
      <span class="city">${job.city}</span>
      <h3>${job.title}</h3>
      <p>${job.text}</p>
      <span class="go">Откликнуться →</span>
    `;

    button.onclick = () => {
      selected = new Set([job.cat]);
      renderDD();
      location.hash = "#/apply";
    };

    cardsEl.appendChild(button);
  });

  if (!expanded && list.length > VISIBLE_DEFAULT) {
    const moreButton = document.createElement("button");

    moreButton.className = "card more";

    moreButton.innerHTML = `
      Смотреть больше

      <svg
        width="150"
        height="100"
        viewBox="0 0 150 100"
        fill="none"
        stroke="#ddd"
      >
        <path d="M5 10 C5 70 50 95 140 80"/>
        <path d="M128 72 L142 80 L128 90"/>
      </svg>
    `;

    moreButton.onclick = () => {
      expanded = true;
      renderCards();
    };

    cardsEl.appendChild(moreButton);
  }

  if (!list.length) {
    cardsEl.innerHTML = "";
    cardsEl.insertAdjacentHTML("afterend", "");
  }
}

/* Фильтрация вакансий */

document.getElementById("tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");

  if (!tab) {
    return;
  }

  document.querySelectorAll(".tab").forEach((item) => {
    item.classList.remove("active");
  });

  tab.classList.add("active");

  filter = tab.dataset.f;
  expanded = false;

  renderCards();
});

/* Сворачивание списка стажировок */

document.getElementById("avail").onclick = function () {
  this.classList.toggle("closed");
  document.getElementById("int-body").classList.toggle("hide");
};

renderCards();

/* Выбор направлений стажировки */

let selected = new Set();

const dd = document.getElementById("dd");
const ddList = document.getElementById("dd-list");
const ddText = document.getElementById("dd-text");

function renderDD() {
  ddList.innerHTML = "";

  DIRECTIONS.forEach((direction) => {
    const option = document.createElement("div");

    option.className =
      "dd-opt" + (selected.has(direction) ? " sel" : "");

    option.innerHTML = `
      <span class="box"></span>${direction}
    `;

    option.onclick = (event) => {
      event.stopPropagation();

      if (selected.has(direction)) {
        selected.delete(direction);
      } else {
        selected.add(direction);
      }

      renderDD();
      clearErr("f-dir");
    };

    ddList.appendChild(option);
  });

  if (selected.size) {
    ddText.textContent = [...selected].join(", ");
    ddText.classList.remove("ph");
  } else {
    ddText.textContent = "Выберите направления";
    ddText.classList.add("ph");
  }
}

document.getElementById("dd-btn").onclick = (event) => {
  event.stopPropagation();
  dd.classList.toggle("open");
};

document.addEventListener("click", (event) => {
  if (!dd.contains(event.target)) {
    dd.classList.remove("open");
  }
});

renderDD();

/* Выбор файла резюме */

const fileInp = document.getElementById("file");
const fname = document.getElementById("fname");

fileInp.onchange = () => {
  fname.textContent = fileInp.files[0]
    ? fileInp.files[0].name
    : "";

  clearErr("f-file");
};

/* Проверка формы */

const errbox = document.getElementById("errbox");

function clearErr(id) {
  document.getElementById(id).classList.remove("err");
}

["name", "email"].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => {
    clearErr("f-" + id);
  });
});

function validate() {
  const errs = [];

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();

  ["f-name", "f-email", "f-dir", "f-file"].forEach(clearErr);

  if (name.split(/\s+/).filter(Boolean).length < 2) {
    errs.push("Укажите ФИО полностью.");
    document.getElementById("f-name").classList.add("err");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errs.push("Введите корректный email.");
    document.getElementById("f-email").classList.add("err");
  }

  if (!selected.size) {
    errs.push("Выберите хотя бы одно направление стажировки.");
    document.getElementById("f-dir").classList.add("err");
  }

  const file = fileInp.files[0];

  if (!file) {
    errs.push("Прикрепите файл с резюме.");
    document.getElementById("f-file").classList.add("err");
  } else if (!/\.(pdf|docx?)$/i.test(file.name)) {
    errs.push("Формат файла: PDF, DOC или DOCX.");
    document.getElementById("f-file").classList.add("err");
  } else if (file.size > 5 * 1024 * 1024) {
    errs.push("Размер файла не должен превышать 5 МБ.");
    document.getElementById("f-file").classList.add("err");
  }

  if (!document.getElementById("consent").checked) {
    errs.push(
      "Необходимо согласие на обработку персональных данных."
    );
  }

  return errs;
}

/* Кнопка отправки */

document.getElementById("submit").onclick = () => {
  const errs = validate();

  if (errs.length) {
    errbox.innerHTML = errs.join("<br>");
    errbox.classList.add("show");

    errbox.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    return;
  }

  errbox.classList.remove("show");

  // Здесь можно подключить отправку на сервер (fetch/FormData).
  // Сейчас форма только демонстрирует успешную отправку.

  document.getElementById("form").reset();

  selected = new Set();
  renderDD();

  fname.textContent = "";

  location.hash = "#/success";
};

/* Первоначальное отображение страницы */

route();