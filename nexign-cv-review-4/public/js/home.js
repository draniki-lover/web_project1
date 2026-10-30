// аккордеон «Вопросы и ответы» на главной

var items = document.querySelectorAll(".faq-item");

function closeItem(item) {
  item.classList.remove("open");
  item.querySelector(".faq-a").style.maxHeight = null;
  item.querySelector(".faq-q").setAttribute("aria-expanded", "false");
}

items.forEach(function (item) {
  var question = item.querySelector(".faq-q");
  var answer = item.querySelector(".faq-a");

  question.addEventListener("click", function () {
    var wasOpen = item.classList.contains("open");

    // одновременно открыт только один вопрос
    items.forEach(closeItem);

    if (!wasOpen) {
      item.classList.add("open");
      answer.style.maxHeight = answer.scrollHeight + 18 + "px";
      question.setAttribute("aria-expanded", "true");
    }
  });
});
