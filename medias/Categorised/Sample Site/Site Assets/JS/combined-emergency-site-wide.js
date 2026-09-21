function setCookieT4(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookieT4(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookieT4(noticeId) {
  let cname = `notice-${noticeId}`;
  let notice = getCookieT4(cname);
  let targetEl = document.querySelector(`[data-id="${noticeId}"]`);
  if (notice.length < 1) {
    targetEl.style.setProperty("display", "block", "important");
  } else {
    targetEl.style.setProperty("display", "none", "important");
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  let siteWideNotices = document.querySelectorAll(".site-wide-notice");
  if (siteWideNotices) {
    siteWideNotices.forEach((notice) => {
      if (notice.getAttribute("data-id")) {
        let dataId = notice.getAttribute("data-id");
        checkCookieT4(dataId);
      }
      if (notice.classList.contains("emergency")) {
        let noticeBtn = notice.querySelector("button");
        noticeBtn.style.setProperty("display", "none", "important");
      }
    });
  }

  let noticeBtns = document.querySelectorAll(".t4.site-wide-notice button");
  if (noticeBtns) {
    noticeBtns.forEach((notice) => {
      notice.addEventListener("click", (el) => {
        // Get the data-close attribute from the button itself, not the target
        let elementId = notice.getAttribute("data-close");
        // Only proceed if we have a valid elementId
        if (elementId) {
          let cname = `notice-${elementId}`;
          let targetEl = document.querySelector(`[data-id="${elementId}"]`);
          if (targetEl) {
            setCookieT4(cname, elementId, 1);
            targetEl.style.setProperty("display", "none", "important");
          }
        }
      });
    });
  }
});

const EmergencyNotices = {
  setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${cname}=${cvalue}; ${expires}; path=/`;
  },

  getCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let c of ca) {
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  },

  async init() {
    const container = document.querySelector(".emergencynotice");
    if (!container) return;

    const jsonUrl = container.getAttribute("data-t4-emergency-notices");
    if (!jsonUrl) return;

    const EmCookieSet = this.getCookie("emergency").split(",");
    const random = Date.now(); // Use timestamp instead of random number
    const url = `${jsonUrl}${jsonUrl.includes("?") ? "&" : "?"}ver=${random}`;

    let retries = 3;
    let delay = 200; // 1 second delay between retries

    while (retries > 0) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.notices?.length) {
          // Filter out the empty entry and invalid notices
          const validNotices = data.notices.filter(
            (notice) =>
              notice &&
              Object.keys(notice).length > 0 &&
              notice.id &&
              notice.html
          );

          validNotices.forEach((notice) => {
            // Handle notices with empty dates
            if (!notice.publishDate && !notice.expireDate) {
              this.processNotice(notice, container, EmCookieSet);
            }
            // Handle notices with dates
            else if (this.isNoticeValid(notice)) {
              this.processNotice(notice, container, EmCookieSet);
            }
            // Remove notices that have become invalid
            else {
              const existingNotice = container.querySelector(
                `[data-id="${notice.id}"]`
              );
              if (existingNotice) {
                existingNotice.remove();
              }
            }
          });

          // Add event listeners for close buttons
          const closeButtons = container.querySelectorAll("[data-close]");

          closeButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
              const noticeId = button.getAttribute("data-close");

              const notice = container.querySelector(`[data-id="${noticeId}"]`);
              if (!notice) return;

              const noticeVersion = notice.getAttribute("data-version");
              notice.style.display = "none";

              const currentCookie = this.getCookie("emergency");
              const cookieValue = `${noticeId}>>${noticeVersion}`;

              if (!currentCookie) {
                this.setCookie("emergency", cookieValue, 1);
              } else if (!currentCookie.includes(cookieValue)) {
                this.setCookie(
                  "emergency",
                  `${currentCookie},${cookieValue}`,
                  1
                );
              }
            });
          });
        }

        // If we get here, the fetch was successful, so break the retry loop
        break;
      } catch (error) {
        retries--;
        console.error(
          `Failed to fetch emergency notices (${retries} retries left):`,
          error
        );

        if (retries === 0) {
          console.error("All retry attempts failed");
          break;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Refresh every 10 seconds
    setTimeout(() => this.init(), 10000);
  },
  processNotice(notice, container, EmCookieSet) {
    const existingNotice = container.querySelector(`[data-id="${notice.id}"]`);

    const noticeInCookie = EmCookieSet.includes(
      `${notice.id}>>${notice.version}`
    );

    const isEmergency = notice.noticetype
      ? notice.noticetype.toLowerCase() === "emergency"
      : false;

    // Remove outdated notice version
    if (existingNotice) {
      if (existingNotice.getAttribute("data-version") !== notice.version) {
        existingNotice.remove();
      } else {
        return;
      }
    }

    // Add new notice if not dismissed or is emergency
    if (!noticeInCookie || isEmergency) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = notice.html.trim();

      // Get the first element child (the notice div)
      const noticeElement = tempDiv.firstElementChild;

      if (noticeElement) {
        // Remove close button if emergency
        if (isEmergency) {
          const closeButton = noticeElement.querySelector("[data-close]");
          if (closeButton) {
            closeButton.remove();
          }
        }

        container.appendChild(noticeElement);
      } else {
      }
    } else {
    }
  },
  isNoticeValid(notice) {
    // If both dates are empty, consider it valid
    if (!notice.publishDate && !notice.expireDate) return true;

    const publishDate = notice.publishDate
      ? new Date(notice.publishDate)
      : new Date(0);
    const expireDate = notice.expireDate
      ? new Date(notice.expireDate)
      : new Date(8640000000000000); // Max date
    const now = new Date();

    return now >= publishDate && now < expireDate;
  },
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  EmergencyNotices.init();
});
