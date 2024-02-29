
/*hljs.configure({
    languages: ['javascript'],
    cssSelector: 'pre.highlight'
});*/
window.onload = function () {
    hljs.registerLanguage('cre', (hljs) => {
        return {
            name: 'cre',
            aliases: [],
            case_insensitive: false,
            keywords: {
                $pattern: /[a-zA-Z0-9\\-]+/,
                keyword: ['or', "match", "not"],
                literal: [
                    "any", "digit", "white-space", "whitespace", "word-char", "word-character",
                    "nl", "new-line", "lf", "line-feed", "cr", "carriage-return", "tab", "tabulation",
                    "nul", "null", "sp", "space", "nbsp", "term", "terminator", "line-term", "line-terminator",
                    "prop", "property",
                ],
            },
            contains: [
                hljs.COMMENT(/\/\*/, /\*\//),
                hljs.COMMENT(/\/\//, /$/),
                {
                    scope: 'literal',
                    begin: cre.ignoreCase`"\\", [rnt0]`,
                },
                {
                    scope: 'keyword',
                    begin: cre.ignoreCase`
                        optional ("lazy-" or "non-greedy-");
                        {
                            optional "repeat-";
                            {
                                optional "at-";
                                "least-" or "most-";
                                at-least-1 digit;
                            } or {
                                at-least-1 digit;
                                optional ("-to-", at-least-1 digit);
                            }
                            optional ("-time", optional "s");
                        } or {
                            "optional";
                        } or {
                            "repeat";
                        }`,
                },
                {
                    scope: 'name',
                    begin: cre`[a-zA-Z_], repeat [a-zA-Z0-9_], ":"`,
                },
                {
                    scope: 'string',
                    begin: /"/,
                    end: /"/,
                    contains: [
                        { begin: cre`"\\", any` },
                        { scope: 'subst', begin: /\${/, end: /}/ },
                    ],
                },
                {
                    scope: 'string',
                    begin: /'/,
                    end: /'/,
                    contains: [
                        { begin: cre`"\\", any` },
                        { scope: 'subst', begin: /\${/, end: /}/ },
                    ],
                },
                {
                    scope: 'text',
                    begin: /</,
                    end: />/,
                },
                {
                    scope: 'regexp',
                    begin: /\[/,
                    end: /\]/,
                    contains: [
                        { begin: cre`"\\", any` },
                        { scope: 'subst', begin: /\${/, end: /}/ },
                    ],
                },
                {
                    scope: 'subst',
                    begin: /\${/,
                    end: /}/,
                },
                {
                    scope: 'type',
                    begin: cre.ignoreCase`
                        {
                            ("end" or "start" or "begin"), "-of-", ("text" or "line");
                        } or {
                            "word-bound", optional "ary";
                        } or {
                            "look", optional "-", ("ahead" or "behind");
                        }
                        `,
                }
            ]
        }
    });
    let js = hljs.getLanguage('javascript').rawDefinition();
    console.log(js);
    let jscre = {
        ...js,
        aliases: [],
        name: 'javascriptwithcre',
        contains: [
            {
                begin: /cre(?:\.[a-zA-Z0-9_.]+)?`/,
                end: /\B|\b/,
                starts: {
                    begin: /\B|\b/,
                    end: '`',
                    terminatorEnd: "`",
                    subLanguage: "cre",
                },
            },
            {
                scope: 'regexp',
                begin: cre`"/", lookahead not "/"`,
                end: /\/[gimuvsy]*/,
                contains: [
                    { begin: cre`"\\", any` },
                    {
                        begin: /\[/,
                        end: /\]/,
                        contains: [
                            { begin: cre`"\\", any` },
                        ],
                    },
                ],
            },
            ...js.contains,
        ],
    }
    hljs.registerLanguage('javascriptwithcre', () => jscre);
    for (let element of document.getElementsByClassName('language-javascriptwithcre')) {
        hljs.highlightElement(element);
    }
    for (let element of document.getElementsByClassName('language-bash')) {
        hljs.highlightElement(element);
    }
    for (let element of document.getElementsByClassName('language-html')) {
        hljs.highlightElement(element);
    }
    nextScript();
}

function nextScript() {
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
    });

    setupClicks();

    swiper.slideTo(document.querySelectorAll('.swiper-slide').length - 2, 500);

    document.querySelector(".mySwiper").style.visibility = 'visible';
}
