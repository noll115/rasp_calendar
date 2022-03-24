import * as bleno from 'bleno';

const characteristics = new bleno.Characteristic({
  uuid: 'aaa2',
  properties: ['read', 'write'],
  onReadRequest: (_, cb) => {
    let buffer = Buffer.from('test');
    cb(bleno.Characteristic.RESULT_SUCCESS, buffer);
  },
  onWriteRequest: (data, _offset, _withoutResp, cb) => {
    console.log(data.toString());
    cb(bleno.Characteristic.RESULT_SUCCESS);
  }
});

const service = new bleno.PrimaryService({
  uuid: 'aaa1',
  characteristics: [characteristics]
});

bleno.on('advertisingStart', err => {
  bleno.setServices([service]);
  console.log(err);
});

bleno.on('advertisingStop', () => {
  console.log('add stop');
});

bleno.on('stateChange', state => {
  console.log(state);
  if (state === 'poweredOn') {
    console.log(service.uuid);
    bleno.startAdvertising('Rasp Calendar', [service.uuid]);
  } else {
    bleno.stopAdvertising();
  }
});

class BluetoothAdapter {
  characteristic: typeof bleno.Characteristic;
  constructor() {}
}
