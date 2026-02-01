let b_menu = document.querySelector(".b_menu");
let b_close = document.querySelector(".b_close");
let menu = document.querySelector(".menu");
let n_menu = document.querySelector(".n_menu");

b_menu.addEventListener("click", () => {
    menu.classList.toggle("active");
    n_menu.classList.toggle("active");
});

b_close.addEventListener("click", () => {
    menu.classList.toggle("active");
    n_menu.classList.toggle("active");
});
