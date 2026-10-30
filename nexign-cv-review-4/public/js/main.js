// общее для всех страниц: меню на телефоне, кнопка «В начало», всплывашка

var burger = document.getElementById("burger");
var menu = document.getElementById("menu");

burger.addEventListener("click", function () {
  menu.classList.toggle("open");
});

// кнопка «В начало» есть не на всех страницах
var toTop = document.getElementById("to-top");
if (toTop) {
  window.addEventListener("scroll", function () {
    toTop.classList.toggle("show", window.scrollY > 400);
  });
  toTop.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// показать короткое сообщение внизу экрана
function showToast(text) {
  var toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}
