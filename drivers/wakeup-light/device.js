'use strict';

const { Device } = require('homey');
const somneoapi = require('../../api/somneo_api');


class WakeupLightDevice extends Device {

  async onInit() {
    this.log('Wakeup-Light: '+this.getName()+' - Device has been initialized');
    await this.fixCapabilities();
    this.start_update_loops();
  }

  async fixCapabilities()
  {
    if(!this.hasCapability('onoff'))
      await this.addCapability('onoff');
    if(!this.hasCapability('dim'))
      await this.addCapability('dim');
    if(!this.hasCapability('measure_humidity'))
      await this.addCapability('measure_humidity');
    if(!this.hasCapability('measure_luminance'))
      await this.addCapability('measure_luminance');
    if(!this.hasCapability('measure_temperature'))
      await this.addCapability('measure_temperature');
    if(!this.hasCapability('measure_noise'))
      await this.addCapability('measure_noise');
    if(!this.hasCapability('nightlight'))
      await this.addCapability('nightlight');
    if(!this.hasCapability('sunset'))
      await this.addCapability('sunset');

    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerCapabilityListener('nightlight', this.onCapabilityNightlight.bind(this));
    this.registerCapabilityListener('sunset', this.onCapabilitySunset.bind(this));
    
  }


  start_update_loops() {
    this.update_loop_sensors();
    this.update_loop_mainlight();
    //this.update_loop_timers();
    this.refreshState();
  }
  update_loop_sensors() {
    let interval = 30000;
    this._timerSensors = setInterval(() => {
        this.updateSensors();
    }, interval);
  }
  update_loop_mainlight() {
    let interval = 31000;
    this._timerLight = setInterval(() => {
        this.updateMainLightState();
    }, interval);
  }
  update_loop_timers() {
    let interval = 60000;
    this._timerTimers = setInterval(() => {
        this.updateTimerState();
    }, interval);
  }

  async refreshState()
  {
    //Expand this with the update methods of the other features of the device
    //this.updateAlarmState();
    //this.updateAlarmSchedules();
    //this.updateTimerState();
  }

  async onAdded() {
    this.log('Wakeup-Light: '+this.getName()+' - Device has been added');
  }

  async updateSensors()
  {
    somneoapi.getSensors(this.getStoreValue('address')).then(sensordata => {
        //this.log(JSON.stringify(sensordata))
        this.setCapabilityValue('measure_humidity', sensordata.msrhu);
        this.setCapabilityValue('measure_luminance', sensordata.mslux);
        this.setCapabilityValue('measure_temperature', sensordata.mstmp);
        this.setCapabilityValue('measure_noise', sensordata.mssnd);
    }).catch(e => { 
      this.log('Error on retrieving sensor data: '+e);
    });
  }

  // this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityOnoff( value, opts ) {
    await this.setCapabilityValue('onoff', value);
    await this.setCapabilityValue('nightlight', false);
    await this.setCapabilityValue('sunset', false);
    return await this.setMainLightState();
  }
  // this method is called when the Device has requested a state change (dim)
  async onCapabilityDim( value, opts ) {
    await this.setCapabilityValue('dim', value);
    return await this.setMainLightState();
  }
  // this method is called when the Device has requested a state change (sunset)
  async onCapabilitySunset( value, opts ) {
    await this.setCapabilityValue('sunset', value);
    await this.setCapabilityValue('onoff', false);
    await this.setCapabilityValue('nightlight', false);
    var dim = 25*this.getCapabilityValue('dim');
    somneoapi.putMainLightState(this.getStoreValue('address'), false, dim, value, false).then(lightstatedata => {
      this.log(JSON.stringify(lightstatedata))
    }).catch(e => { 
      this.log('Error on updating Light status: '+e);
      return e;
    });
  }
  // this method is called when the Device has requested a state change (nightlight)
  async onCapabilityNightlight( value, opts ) {
    await this.setCapabilityValue('nightlight', value);
    await this.setCapabilityValue('sunset', false);
    await this.setCapabilityValue('onoff', false);
    var dim = 25*this.getCapabilityValue('dim');
    somneoapi.putMainLightState(this.getStoreValue('address'), false, dim, false, value).then(lightstatedata => {
      this.log(JSON.stringify(lightstatedata))
    }).catch(e => { 
      this.log('Error on updating Light status: '+e);
      return e;
    });
  }

  async setMainLightState()
  {
    var onoff = this.getCapabilityValue('onoff');
    var dim = 25*this.getCapabilityValue('dim');
    console.info('send light update to device ['+onoff+'|'+dim+']');
    var sunrise = false;
    var nightlight = false;
    this.getStoreValue('address')
    somneoapi.putMainLightState(this.getStoreValue('address'), onoff, dim, sunrise, nightlight).then(lightstatedata => {
      this.log(JSON.stringify(lightstatedata))
    }).catch(e => { 
      this.log('Error on updating Light status: '+e);
      return e;
    });
  }

  async updateMainLightState()
  {
    somneoapi.getMainLightState(this.getStoreValue('address')).then(lightstatedata => {
      //this.log(JSON.stringify(lightstatedata))
      this.setCapabilityValue('onoff', lightstatedata.onoff);
      this.setCapabilityValue('dim', (lightstatedata.ltlvl/25));
      this.setCapabilityValue('sunset', lightstatedata.tempy);
      this.setCapabilityValue('nightlight', lightstatedata.ngtlt);
    }).catch(e => { 
      this.log('Error on retrieving Light status: '+e);
    });
  }

  async updateTimerState()
  {
    somneoapi.getTimersState(this.getStoreValue('address')).then(timerstatedata => {
      this.log(JSON.stringify(timerstatedata))
    }).catch(e => { 
      this.log('Error on retrieving Timer status: '+e);
    });
  }

  async updateAlarmState()
  {
    somneoapi.getAlarmState(this.getStoreValue('address')).then(alarmstatedata => {
      this.log(JSON.stringify(alarmstatedata))
    }).catch(e => { 
      this.log('Error on retrieving Alarm status: '+e);
    });
  }

  async updateAlarmSchedules()
  {
    somneoapi.getAlarmSchedules(this.getStoreValue('address')).then(alarmscheduledata => {
      this.log(JSON.stringify(alarmscheduledata))
    }).catch(e => { 
      this.log('Error on retrieving Alarm schedules: '+e);
    });
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Wakeup-Light: '+this.getName()+' - Device settings where changed');
  }

  async onRenamed(name) {
    this.log('Wakeup-Light: '+this.getName()+' - Device was renamed');
  }

  async onDeleted() {
    this.log('Wakeup-Light: '+this.getName()+' - has been deleted');
  }

  onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    this.log('Located device and ready to retrieve data...');
    this.log('Device: '+this.getName()+' was located with address '+discoveryResult.address);
    this.setStoreValue('address',discoveryResult.address);
    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
  }

  onDiscoveryAddressChanged(discoveryResult) {
    // Update your connection details here, reconnect when the device is offline
    this.log('Device: '+this.getName()+' changed its address to '+discoveryResult.address);
    this.setStoreValue('address',discoveryResult.address);
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    // When the device is offline, try to reconnect here
    //this.api.reconnect().catch(this.error); 
  }
}

module.exports = WakeupLightDevice;
