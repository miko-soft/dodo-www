import { Controller } from '@mikosoft/dodo';

class HomeCtrl extends Controller {

  constructor(app) {
    super();
  }

  async loader(trx) {
    this.setTitle('Regoch Weber - JS Single Page App Framework');
    this.setDescription('The Regoch Weber is simple and intuitive JavaScript framework for browser single page applications and mobile applications.');
    this.setKeywords('regoch, weber, framework, javascript, js, single page app');
    this.setLang('en');

    await this.loadView('#layout', 'pages/home/layout.html');
    await this.loadViews([
      ['#main', 'pages/home/main.html'],
    ], true);
  }

}


export default HomeCtrl;
