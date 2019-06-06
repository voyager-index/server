window.onscroll = () => {
    let scroll = $(window).scrollTop();
    if (scroll > 3000) {
        console.log('circle:', $('.circle'));
        $('.circle').removeClass('fade-out');
    }
    else {
        $('.circle').addClass('fade-out');
    }
}
