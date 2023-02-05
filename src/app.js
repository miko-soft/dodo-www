import { App, corelib } from '@mikosoft/dodo';
import views from './views.js';
import env from './env.js';
console.log('env::', env);
// console.log('views::', views);


// conf
import { $debugOpts, authOpts } from './conf/index.js';


// controllers
import HomeCtrl from './controllers/HomeCtrl.js';
import NotfoundCtrl from './controllers/NotfoundCtrl.js';


// routes
const routes = [
  ['when', '/', 'HomeCtrl'],
  ['notfound', 'NotfoundCtrl']
];

// auth
const auth = new corelib.Auth(authOpts);

// app
const app = new App();

app
  .controllers([
    HomeCtrl,
    NotfoundCtrl
  ]);

app
  .auth(auth) // needed for route authGuards
  .debugger($debugOpts);

app
  .routes(routes)
  .viewsCached(views);
