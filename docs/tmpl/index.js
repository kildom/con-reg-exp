

window.onload = function () {

    let x = 0;
    function updateFeature() {
        x++;
        if (x == $(".feature").length) {
            $("#feature-list").css('top', '0px');
            x = 1;
        }
        let top = $('.feature').slice(x, x + 1).position().top;
        $("#feature-list").animate({
            top: -top + 'px',
        }, 500, function () {
            setTimeout(updateFeature, 1100);
        });
    }
    setTimeout(updateFeature, 1400);

    let activeSlide = 0;

    function setupClicks() {
        let slides = document.querySelectorAll('.swiper-slide');
        let index = 0;
        for (let slide of slides) {
            let thisIndex = index;
            slide.addEventListener('click', event => {
                if (thisIndex !== activeSlide) {
                    swiper.slideTo(thisIndex, 300);
                }
            });
            index++;
        }
        swiper.on('slideChange', function () {
            activeSlide = swiper.activeIndex;
        });
    }

    var swiper = new Swiper(".mySwiper", {
        slidesPerView: "auto",
        effect: "coverflow",
        coverflowEffect: {
            rotate: 20,
            stretch: 1,
            depth: 800,
            modifier: 1,
            slideShadows: false,
        },
        centeredSlides: true,
        spaceBetween: 0,
        simulateTouch: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        initialSlide: document.querySelectorAll('.swiper-slide').length - 2,
    });

    setupClicks();

    document.querySelector(".mySwiper").style.visibility = 'visible';

    document.querySelector(".swiper-wrapper").style.width = '1px';
}
