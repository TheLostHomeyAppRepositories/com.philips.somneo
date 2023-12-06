'use strict';

const Homey = require('homey');

class PhilipsSomneoApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Philips-Somneo app has been initialized');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

}

module.exports = PhilipsSomneoApp;
