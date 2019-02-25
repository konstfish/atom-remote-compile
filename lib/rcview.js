'use babel';

export default class rcview {

  constructor(serializedState) {
    // Create root element
    this.amount = 0;
    this.element = document.createElement('div');
    this.element.classList.add('rcview');

    /*d = document.createElement("div")
    d.id = "remote-compile-panel "
    d.style.fontSize ='medium'
    d.innerHTML = "test..."
    let options = {'item': d, 'visible': true}
    this.bottomp = atom.workspace.addHeaderPanel(options);
    this.bottomp.show();*/

    // Create message element <h2 class='block'>Heading <span class='badge badge-flexible'>2</span></h2>
    const message = document.createElement('h2');
    message.textContent = 'Output:';
    message.classList.add('block');
    this.element.appendChild(message);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  addText(instring){
    this.amount += 1;
    const message = document.createElement('div');
    message.textContent = instring;
    message.classList.add('message');
    message.classList.add('rcmessage-' + this.amount);

    console.log("len: " + this.amount)
    if(this.amount >= 10){
      var elem = document.getElement;
      document.getElementsByClassName('rcmessage-' + (this.amount - 9))[0].remove();
    }
    this.element.appendChild(message);
  }

  clearBox(instring){
    this.amount = 0;
    this.element.innerHTML = '';
    const message = document.createElement('h2');
    message.textContent = 'Output:';
    message.classList.add('block');
    this.element.appendChild(message);
  }

}
