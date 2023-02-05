# DoDo Skel
Start new single page app with "dodo-skel" (skeleton) code.


## Howto
How to start a new project in DoDo framework ?
Simply clone the DoDo Skel source code.
```bash
$ git clone https://github.com/miko-soft/dodo-skel.git <projectName>
$ cd <projectName>

// remove .git and start new one
$ rm -rf .git
$ git init

// install npm packages
$ npm install

// start the development
$ npm run dev           -> watch the file changes
```

Another way is to run bash script after cloning is done.
```bash
$ git clone https://github.com/miko-soft/dodo-skel.git <projectName>
$ cd <projectName>
$ bash starter.sh
```
*Notice: The file "starter.sh" will be removed after first use (to prevent accidentally delete of .git folder)*

Run in the browser http://localhost:3333 .
The skel contains an example page. Now you can add/modify your routes, controllers, views, etc.


## Documentation
[http://dodo.mikosoft.info](http://dodo.mikosoft.info)


### Licence
Copyright (c) MikoSoft licensed under [MIT](./LICENSE).
