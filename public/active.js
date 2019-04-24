// https://stackoverflow.com/questions/24514717/bootstrap-navbar-active-state-not-working
$(document).ready(function() {
  $('li.active').removeClass('active');
  $('a[href="' + location.pathname + '"]').closest('li').addClass('active'); 
});

