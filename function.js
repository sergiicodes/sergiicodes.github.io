const images = document.querySelectorAll('.image-gallery img');
let currentIndex = 0;

function changeImage() {
  images.forEach((image, index) => {
    if (index === currentIndex) {
      image.classList.add('active');
    } else {
      image.classList.remove('active');
    }
});

  currentIndex = (currentIndex + 1) % images.length;
}

function startSlideshow() {
  setInterval(changeImage, 4000); // Change image every 3 seconds
}

window.addEventListener('load', () => {
  // Show the first image immediately
  images[0].classList.add('active');

  // Start the slideshow after a delay of 2 seconds
  setTimeout(startSlideshow, 2000);
});
