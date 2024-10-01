// function.js
/*-----------------------------------------*/

// This does the typwriter effect for title
'use strict';

function typeWriter(el) {
    const content = el.getAttribute('data-content'); // Get the plain text
    const textArray = content.split(''); // Split the plain text into an array
    let formattedContent = ''; // To build the formatted content
    el.innerHTML = ''; // Clear the HTML before starting the typewriter effect

    textArray.forEach((letter, i) => {
        setTimeout(() => {
            // As we type, rebuild the HTML structure
            formattedContent += letter;

            // Update the HTML with the correct structure for the highlighted characters
            el.innerHTML = formattedContent
                .replace('in', '<span style="color: #bb86c0;">in</span>')
                .replace('{', '<span style="color: #f1d700;">{</span>')
                .replace('}', '<span style="color: #f1d700;">}</span>')
                .replace('[', '<span style="color: #f1d700;">[</span>')
                .replace(']', '<span style="color: #f1d700;">]</span>')
                .replace('and', '<span style="color: #569cd6;">and</span>');
        }, 95 * i);
    });

    // Loop the typewriter effect every 8 seconds
    setInterval(() => typeWriter(el), 8000);
}

const elementEl = document.getElementById('elementEl');
typeWriter(elementEl);

/*-----------------------------------------*/

// Accordion function, left side
$(document).ready(function() {
    var Accordion = function(el, multiple) {
        this.el = el || {};
        this.multiple = multiple || false;

        // Variables
        var links = this.el.find('.link');

        // Bind event
        links.on('click', {el: this.el, multiple: this.multiple}, this.dropdown);
    }

    Accordion.prototype.dropdown = function(e) {
        var $el = e.data.el;
        var $this = $(this),
            $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('open');

        if (!e.data.multiple) {
            $el.find('.submenu').not($next).slideUp().parent().removeClass('open');
        }
    }   

    var accordion = new Accordion($('#accordion'), false);
});

