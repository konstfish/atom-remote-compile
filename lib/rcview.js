'use babel';

export default class rcview {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('test');

    d = document.createElement("div")
    /*d.id = "remote-compile-panel "
    d.style.fontSize ='medium'
    d.innerHTML = "test..."
    let options = {'item': d, 'visible': true}
    this.bottomp = atom.workspace.addHeaderPanel(options);
    this.bottomp.show();*/

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'Output:';
    message.classList.add('message');
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
    const message = document.createElement('div');
    message.textContent = instring;
    message.classList.add('message');
    this.element.appendChild(message);
  }

}
