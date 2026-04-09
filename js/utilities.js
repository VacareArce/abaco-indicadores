const list = document.querySelectorAll('.list');
const item = document.querySelectorAll('.item');

function accordion(e) {

	e.stopPropagation();
	//alert(e);
	if (this.classList.contains('active')) {
	//this.classList.remove('active');
	} else
	if (this.parentElement.parentElement.classList.contains('active')) {
	this.classList.add('active');

	} else
	{
	for (i = 0; i < list.length; i++) {
	  list[i].classList.remove('active');
	}
	this.classList.add('active');
	}
}

for (i = 0; i < list.length; i++) {
  list[i].addEventListener('click', accordion);
}
//for (i = 0; i < item.length; i++) {
//  list[i].addEventListener('click', accordion);
//}
