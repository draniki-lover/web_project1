// страница заявки: выбор направления, файл, проверка и отправка

var DIRECTIONS = ["Менеджмент", "Развитие бизнеса", "Техническое сопровождение"];
var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

var nameInput = document.getElementById("name");
var emailInput = document.getElementById("email");
var fileInput = document.getElementById("file");
var fileName = document.getElementById("fname");
var consent = document.getElementById("consent");
var subscribe = document.getElementById("subscribe");
var errorBox = document.getElementById("errbox");
var submitBtn = document.getElementById("submit");

var dd = document.getElementById("dd");
var ddBtn = document.getElementById("dd-btn");
var ddList = document.getElementById("dd-list");
var ddText = document.getElementById("dd-text");

var selected = [];

/* ---------- выпадающий список ---------- */

function renderDropdown() {
  ddList.innerHTML = "";

  DIRECTIONS.forEach(function (dir) {
    var opt = document.createElement("button");
    opt.type = "button";
    opt.className = "dd-opt" + (selected.indexOf(dir) !== -1 ? " sel" : "");
    opt.innerHTML = '<span class="box"></span>' + dir;
    opt.addEventListener("click", function (e) {
      e.stopPropagation();
      var i = selected.indexOf(dir);
      if (i === -1) selected.push(dir);
      else selected.splice(i, 1);
      renderDropdown();
      clearError("f-dir");
    });
    ddList.appendChild(opt);
  });

  if (selected.length) {
    ddText.textContent = selected.join(", ");
    ddText.classList.remove("placeholder");
  } else {
    ddText.textContent = "Выберите направление";
    ddText.classList.add("placeholder");
  }
}

ddBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  dd.classList.toggle("open");
});

// клик мимо списка закрывает его
document.addEventListener("click", function (e) {
  if (!dd.contains(e.target)) dd.classList.remove("open");
});

// если пришли со страницы стажировок, направление уже выбрано
var fromUrl = new URLSearchParams(location.search).get("dir");
if (fromUrl && DIRECTIONS.indexOf(fromUrl) !== -1) {
  selected.push(fromUrl);
}
renderDropdown();

/* ---------- файл ---------- */

fileInput.addEventListener("change", function () {
  var file = fileInput.files[0];
  fileName.textContent = file ? file.name : "";
  clearError("f-file");
});

/* ---------- ошибки ---------- */

function clearError(id) {
  document.getElementById(id).classList.remove("err");
}
function markError(id) {
  document.getElementById(id).classList.add("err");
}

nameInput.addEventListener("input", function () { clearError("f-name"); });
emailInput.addEventListener("input", function () { clearError("f-email"); });

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

function showErrors(list) {
  errorBox.innerHTML = list.map(escapeHtml).join("<br>");
  errorBox.classList.add("show");
  errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

// проверяем всю форму, возвращаем список ошибок
function validate() {
  var errors = [];
  ["f-name", "f-email", "f-dir", "f-file"].forEach(clearError);

  var name = nameInput.value.trim();
  if (name.split(/\s+/).filter(Boolean).length < 2) {
    errors.push("Укажите ФИО полностью.");
    markError("f-name");
  }

  var emailError = checkEmail(emailInput.value.trim());
  if (emailError) {
    errors.push(emailError);
    markError("f-email");
  }

  if (!selected.length) {
    errors.push("Выберите хотя бы одно направление стажировки.");
    markError("f-dir");
  }

  var file = fileInput.files[0];
  if (!file) {
    errors.push("Прикрепите файл с резюме.");
    markError("f-file");
  } else if (!/\.pdf$/i.test(file.name)) {
    errors.push("Резюме нужно загрузить в формате PDF.");
    markError("f-file");
  } else if (file.size > MAX_FILE_SIZE) {
    errors.push("Размер файла не должен превышать 10 МБ.");
    markError("f-file");
  }

  if (!consent.checked) {
    errors.push("Необходимо согласие на обработку персональных данных.");
  }
  return errors;
}

/* ---------- отправка ---------- */

// читаем файл и отдаём его в base64 (без префикса data:...)
function readFile(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      resolve(String(reader.result).split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

submitBtn.addEventListener("click", async function () {
  var errors = validate();
  if (errors.length) {
    showErrors(errors);
    return;
  }
  errorBox.classList.remove("show");

  var buttonText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Отправляем…";

  try {
    var file = fileInput.files[0];
    var payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      directions: selected,
      consent: true,
      subscribe: subscribe.checked,
      fileName: file.name,
      fileData: await readFile(file)
    };

    var response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    var data = {};
    try { data = await response.json(); } catch (e) { /* ответ без json */ }

    if (!response.ok) {
      (data.fields || []).forEach(function (id) {
        var box = document.getElementById("f-" + id);
        if (box) box.classList.add("err");
      });
      showErrors(data.errors || ["Не удалось отправить заявку. Попробуйте позже."]);
      return;
    }

    // дату рекомендаций покажем на странице успеха
    sessionStorage.setItem("cvReviewDate", data.expectedDate);
    location.href = "success.html";
  } catch (e) {
    showErrors(["Нет связи с сервером. Откройте сайт через запущенный сервер (npm start), а не как отдельный файл."]);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = buttonText;
  }
});
