 /* Cookie Personalization */
  function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue.toLowerCase() + "; " + expires + ";" + "path=/";
  }
  function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0)===' ') c = c.substring(1);
      if (c.indexOf(name) !== -1) return c.substring(name.length, c.length);
    }
    return "";
  }
  /* ./cookie functions */

  /* Course Type */

  // Handle the form submission
  let searchForm = document.querySelector('.home-course-search');
  if (searchForm) {
    searchForm.addEventListener('submit', function() {
      setCookie('courseType', "", 7);  // Clear the cookie
      let searchParameter = searchForm.querySelector('input[name="courseType"]:checked');
      if (searchParameter) {
        setCookie('courseType', searchParameter.value, 7);  // Set the cookie with the selected value
      }
      setCookie('lastSearch', "", 7);  // Clear the cookie
      let searchTerm = searchForm.querySelector('input[type="search"]').value;
      if (searchTerm) {
        setCookie('lastSearch', searchTerm, 7);  // Set the cookie with the selected value
      }
    });
  }

  // Get the cookie value for course type and set the option if a match is found
  let cookieValue = getCookie('courseType');
  if (cookieValue) {
    let inputValues = document.querySelectorAll("input[name='courseType']");
    for (let input of inputValues) {
        if (input.value.toLowerCase() === cookieValue.toLowerCase()) {
            input.checked = true;  // Set the input as checked
            break; // Stop loop once a match is found
        }
    }
  }

  // Hide elements with class 'el-disabled' and show the ones based on the cookie value
  document.querySelectorAll('.el-disabled').forEach(function(element) {
    element.style.display = 'none';  // Hide elements
  });

  // Show elements based on cookie value
  // First check if the keyword for the last search matches any personalisation element
  let lastSearch = getCookie("lastSearch");
  let personalised = false;
  if (lastSearch) {
    var elements = document.querySelectorAll(`[data-keyword="${lastSearch}"]`);
    // match found
    if (elements.length > 0) {
      // hide the default and audience elements
      document.querySelectorAll('[data-default], [data-audience]').forEach(function(element) {
        element.style.display = 'none';  
      });
      // show matching elements
      elements.forEach(function(element) {
        element.style.display = 'block';
      });
      personalised = true;
    }
  } 
  
  // if audience set and personalisation flag is false check for any matches
  var audience = getCookie("courseType");
  if (audience && !personalised) {
    var elements = document.querySelectorAll(`[data-audience="${audience}"]`);
    //match found
    if (elements.length > 0) {
      // hide the default and keyword elements
      document.querySelectorAll('[data-default], [data-keyword]').forEach(function(element) {
        element.style.display = 'none';  // Hide Default elements
      });
      // show matching elements
      elements.forEach(function(element) {
        element.style.display = 'block';
      });
      personalised = true;
    } 
  }

  // if no personalisation matches show the default elements
  if (!personalised) {
    document.querySelectorAll('[data-default]').forEach(function(element) {
      element.style.display = 'block';  // Show Default elements if no courseType cookie
    });
  }