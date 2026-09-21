var cache = [];

$(window).on('popstate', function () {
  var url = window.location.search;
  if (cache[url] == undefined) {
    url = 'index.php' + url;
  }
  if (cache[url] != undefined) {
    var link = cache[url][0];
    var loadArea = cache[url][1];
    var reloadLoadArea = cache[url][2];
    runAjax(link, loadArea, reloadLoadArea, false);
  }
});

const t4afterajax = new CustomEvent('t4-after-ajax', {});

function runAjax(link, loadArea, reloadLoadArea, addcache) {
  var loadAreaID = loadArea.prop('id');
  var contentID = loadArea.data("ajaxloadalso");

  if (typeof addcache === 'undefined') {
    addcache = true;
  }

  if (reloadLoadArea === true) {
    loadArea.css('opacity', 0.5);
  }

  if (contentID != undefined) {
    for (let i = 0; i < contentID.length; ++i) {
      $("#" + contentID[i]).css('opacity', 0.5);
    }
  }

  $.ajax({
    url: link,
    context: document.body
  }).done(function (data) {
    if (addcache) {
      cache[link] = [link, loadArea, reloadLoadArea];
      window.history.pushState(link, link, link);
    }

    if (reloadLoadArea === true) {
      loadArea.html($(data).find("#" + loadAreaID).html()).css('opacity', 1);
    }

    if (contentID != undefined) {
      for (let i = 0; i < contentID.length; ++i) {
        $("#" + contentID[i]).html($(data).find("#" + contentID[i]).html()).css('opacity', 1);

        if (contentID[i] == 'past_events') {
          let pastEventInput = document.querySelector('#showPastEvents');
          if (pastEventInput) {
            pastEventInput.addEventListener('click', function () {
              const parentDiv = this.closest('.checkbox');
              parentDiv.classList.toggle('checkbox--active');
            });
          }
        }

        if (contentID[i] == 'searchoptions-categories') {
          document.dispatchEvent(t4afterajax);

          var checkboxes = document.querySelectorAll('#searchoptions-categories .checkbox input[type="checkbox"]');
          checkboxes.forEach(function (checkbox) {
            checkbox.addEventListener('change', function () {
              var parentDiv = this.closest('.checkbox');
              parentDiv.classList.toggle('checkbox--active');
            });
          });

          var radios = document.querySelectorAll('#searchoptions-categories .radio input[type="radio"]');
          radios.forEach(function (radio) {
            radio.addEventListener('change', function () {
              var parentFieldset = this.closest('fieldset');
              var fields = parentFieldset.querySelectorAll('.radio');
              fields.forEach(function (field) {
                field.classList.remove('radio--active');
              });
              var parentDiv = this.closest('.radio');
              parentDiv.classList.toggle('radio--active');
            });
          });
        }
      }
    }

    categories_trigger();
  });
}

/**
 * Decide whether a clicked calendar link should use AJAX or normal navigation.
 * Rules:
 * 1. If it points to a different pathname, let browser navigate normally.
 * 2. If it points to same pathname, AJAX it.
 * 3. If you later identify a specific "month nav" selector, prefer that.
 */
function shouldUseAjaxForCalendarLink(anchor) {
  const href = anchor.attr('href');
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
    return false;
  }

  const targetUrl = new URL(href, window.location.origin);
  const currentUrl = new URL(window.location.href);

  // different page => normal navigation
  if (targetUrl.pathname !== currentUrl.pathname) {
    return false;
  }

  // same page => AJAX
  return true;
}

$("body").on("click", ".ajax-load-area .ajax-load-link a, a.ajax-load-link", function (event) {
  if (!(($('#calendar_events').length || $('#calendar_page').length) || $('#calendar_box').length)) {
    return;
  }

  var $link = $(this);

  // Let day links to the main calendar page navigate normally
  if (!shouldUseAjaxForCalendarLink($link)) {
    return;
  }

  event.preventDefault();

  var link = $link.attr("href");
  var loadArea = $link.parents('.ajax-load-area').first();
  var loadAreaID = loadArea.prop('id');

  if (!loadArea.length) {
    return;
  }

  if (loadAreaID != 'searchoptions' && loadAreaID != 'searchoptions-generic') {
    runAjax(link, loadArea, true);
  }

  if ($link.parents('.pagination').length) {
    const calendarEvents = $("#calendar_events");
    if (calendarEvents.length) {
      window.scrollTo({
        top: calendarEvents.offset().top - $('header').height(),
        behavior: "smooth"
      });
    }
  }
});