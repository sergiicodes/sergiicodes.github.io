// function.js
/*-----------------------------------------*/

// This does the typwriter effect for title
'use strict';

function typeWriter(el) {
  const content = el.getAttribute('data-content');
  const textArray = content.split('');
  let formattedContent = '';
  // el.innerHTML = ''; // Don't clear immediately to prevent blinking on first load if called multiple times

  // Typing speed in ms
  const typingSpeed = 95;

  let i = 0;
  function type() {
    if (i < textArray.length) {
      formattedContent += textArray[i];
      el.innerHTML = formattedContent
        .replace('in', '<span style="color: #bb86c0;">in</span>')
        .replace('{', '<span style="color: #f1d700;">{</span>')
        .replace('}', '<span style="color: #f1d700;">}</span>')
        .replace('[', '<span style="color: #f1d700;">[</span>')
        .replace(']', '<span style="color: #f1d700;">]</span>')
        .replace('and', '<span style="color: #569cd6;">and</span>');
      i++;
      setTimeout(type, typingSpeed);
    } else {
      // Restart cycle
      setTimeout(() => {
        el.innerHTML = '';
        typeWriter(el);
      }, 8000);
    }
  }

  el.innerHTML = '';
  type();
}

const elementEl = document.getElementById('elementEl');
if (elementEl) {
  typeWriter(elementEl);
}

/*-----------------------------------------*/

// Accordion function, left side
document.addEventListener('DOMContentLoaded', function () {
  const accordion = document.getElementById('accordion');

  // Use event delegation or simple query selector
  const links = accordion.querySelectorAll('.link');

  links.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault(); // Good practice for buttons inside forms or anchors, though here it's div converted to button

      const li = this.parentElement;
      const isOpen = li.classList.contains('open');
      const multiple = false; // logic matches original "false" argument

      // If not multiple, close all others
      if (!multiple) {
        accordion.querySelectorAll('li').forEach(item => {
          if (item !== li) {
            item.classList.remove('open');
            // Submenu display handling is done via CSS based on .open class
          }
        });
      }

      // Toggle current
      li.classList.toggle('open');
    });
  });


});

