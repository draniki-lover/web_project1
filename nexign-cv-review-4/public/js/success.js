// страница «Заявка отправлена»: дату берём из ответа сервера

var date = sessionStorage.getItem("cvReviewDate");

if (!date) {
  // сюда попали не через форму — отправляем на заявку
  location.replace("apply.html");
} else {
  document.getElementById("ok-date").textContent = date;
}
