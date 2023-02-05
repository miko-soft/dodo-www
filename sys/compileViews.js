import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs';
const fsp = fs.promises;



class CompileViews {

  /**
   * @param {string} viewsDirRel - relative path of the views directory: 'src/views'
   * @param {number} waitMS - wait period which prevents multiple views.js creation when multitple html files are added/removed [miliseconds]
   */
  constructor(viewsDirRel, waitMS = 3000) {
    this.viewsDir = path.resolve(process.cwd(), viewsDirRel); // absolute path of the views dir
    this.views;
    this.viewPaths;
    this.timeoutObj;
    this.waitMS = waitMS;
  }


  /**
   * Initialise the compiler.
   */
  async init() {
    // check if /views/ folder exists
    const doesExist = await this.dirExists();
    if (!doesExist) { return console.log(`Views folder "${this.viewsDir}" doesn't exist.`); }

    // define initial this.views object: {"inc/footer.html": "<b>FOOTER</b>", "inc/navbar.html": "<b>NAVBAR</b>", ... }
    const views_imported = await import('../src/views.js').catch(err => console.log('WARNING: The "views.js" doesnt exist or has errors. A new "views.js" file will be created.'));
    this.views = !!views_imported ? { ...views_imported } : {}; // cole the object to prevent error: Cannot add property inc/layout.html, object is not extensible
    this.views.default = undefined;

    // init viewPaths (use Set to prevent duplicates)
    this.viewPaths = new Set();

    // watch the directory
    this.dirWatch();
  }



  /**
   * Check if viewsDir exists
   * https://nodejs.org/api/fs.html#fspromisesaccesspath-mode
   * https://nodejs.org/api/fs.html#fs_fs_constants
   */
  async dirExists() {
    let doesExist;
    try {
      const result = await fsp.access(this.viewsDir, fs.constants.F_OK);
      if (result === undefined) { doesExist = true; }
    } catch (err) {
      // console.log(err);
      doesExist = false;
    }
    return doesExist;
  }


  /**
   * Watch viewsDir (src/views/) recursively
   */
  dirWatch() {
    const watcher = chokidar.watch(this.viewsDir, {
      persistent: true, // if false event watcher will be closed

      ignored: /(^|[\/\\])\../, // ignore dotfiles
      ignoreInitial: false,
      followSymlinks: true,
      cwd: '.',
      disableGlobbing: false,

      usePolling: false,
      interval: 10,
      binaryInterval: 30,
      alwaysStat: false,
      depth: 99,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 10
      },

      ignorePermissionErrors: false,
    });

    watcher
      .on('add', this.onAdd.bind(this))
      .on('change', this.onChange.bind(this))
      .on('unlink', this.onUnlink.bind(this));
  }



  /**
   * Callback on add event.
   * @param {string} filePath - absolute view (html file) path
   * @param {string} stats - chokidar statistics object
   */
  async onAdd(filePath, stats) {
    const filePath2 = this._shortenPath(filePath);
    console.log(`   + ${filePath2} [${stats.size} B]`);
    this.viewPaths.add(filePath);

    clearTimeout(this.timeoutObj);
    this.timeoutObj = setTimeout(this.makeViewFile.bind(this), this.waitMS);
  }


  /**
   * Callback on change event.
   * @param {string} filePath - absolute view (html file) path
   * @param {string} stats - chokidar statistics object
   */
  async onChange(filePath, stats) {
    const filePath2 = this._shortenPath(filePath);
    console.log(`   -+ ${filePath2}  [${stats.size} B]`);
    this.viewPaths.add(filePath);

    await this.updateViewFile(filePath);
  }


  /**
   * Callback on unlink event.
   * @param {string} filePath - absolute view (html file) path
   */
  async onUnlink(filePath) {
    const filePath2 = this._shortenPath(filePath);
    console.log(`   - ${filePath2}`);
    this.viewPaths.delete(filePath);

    clearTimeout(this.timeoutObj);
    this.timeoutObj = setTimeout(this.makeViewFile.bind(this), this.waitMS);
  }


  /**
   * Create view.js file
   */
  async makeViewFile() {
    console.log(`   ++++ Make view.js [${this.viewPaths.size}]\n`);
    this.views = {};

    for (const viewPath of this.viewPaths.values()) {
      let html = await fsp.readFile(viewPath, { encoding: 'utf8' });
      html = this._minifyHTML(html);
      html = this._correctHTML(html);

      const viewPath_short = this._shortenPath(viewPath);
      this.views[viewPath_short] = html;
    }

    const views_json = JSON.stringify(this.views, null, 2);

    const fileDest = path.resolve(process.cwd(), 'src/views.js');
    const fileContent = `/*** Generated with $ node compileViews.js  ***  DON'T EDIT MANUALLY !!! ***/\n\nexport default ${views_json};`;
    await fsp.writeFile(fileDest, fileContent, { encoding: 'utf8' });

    // console.log(fileContent);
  }


  /**
   * Update view.js file
   * @param {string} viewPath - the absolute view path
   */
  async updateViewFile(viewPath) {
    console.log(`   --++ Update view.js\n`);

    let html = await fsp.readFile(viewPath, { encoding: 'utf8' });
    html = this._minifyHTML(html);
    html = this._correctHTML(html);

    const viewPath_short = this._shortenPath(viewPath);
    this.views[viewPath_short] = html;

    const views_json = JSON.stringify(this.views, null, 2);

    const fileDest = path.resolve(process.cwd(), 'src/views.js');
    const fileContent = `/*** Generated with $ node compileViews.js  ***  DON'T EDIT MANUALLY !!! ***/\n\nexport default ${views_json};`;
    await fsp.writeFile(fileDest, fileContent, { encoding: 'utf8' });

    // console.log(fileContent);
  }


  /**
   * Shorten absolute file path
   * /web/node/dodo-skel/src/views/pages/playground/view-rginc/main.html -> pages/playground/view-rginc/main.html
   * @param {string} filePath - file absolute path
   * @returns {string}
   */
  _shortenPath(filePath) {
    return filePath.replace(/.*\/views\//, '');
  }


  /**
   * Remove empty spaces, new lines, tabs and HTML comments.
   * @param {string} html - HTML code
   * @return {string} - minified HTML
   */
  _minifyHTML(html) {
    html = html.replace(/\t+/g, ' ');
    html = html.replace(/\s+/g, ' ');
    html = html.replace(/\n+/g, '');
    html = html.replace(/\r+/g, '');
    html = html.replace(/> </g, '><');
    html = html.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, ''); // remove comments
    html = html.trim();
    return html;
  }


  /**
   * Correct HTML to be valid JSON string.
   * @param {string} html - HTML code
   * @return {string} - corrected HTML
   */
  _correctHTML(html) {
    return html;
  }


}




const compileViews = new CompileViews('src/views', 1000);
compileViews.init();

