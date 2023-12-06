'use strict';

const { Driver } = require('homey');

class WakeupLightDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Wakeup-light driver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    this.log('Wakeup-light device discovery started...');
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    
    const devices = Object.values(discoveryResults).map(discoveryResult => {
      this.log(JSON.stringify(discoveryResult.headers.location));
      return {
        name: 'Wake-up light',
        data: {
          location: discoveryResult.headers.location,
          address: discoveryResult.address
        },
      };
    });
    return devices;
  }
}

module.exports = WakeupLightDriver;
