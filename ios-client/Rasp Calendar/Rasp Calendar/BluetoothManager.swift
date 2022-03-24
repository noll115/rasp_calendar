//
//  BluetoothManager.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 2/9/22.
//

import Foundation
import CoreBluetooth

class BluetoothManager: NSObject,CBCentralManagerDelegate,CBPeripheralDelegate {
    private var centralManager: CBCentralManager!
    private var peripheral: CBPeripheral!
    
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        print("Central state update")
        print(CalendarPeripheral.calendarServiceUUID)
        print(CalendarPeripheral.calendarCharacteristicUUID)
        switch central.state {
        case .poweredOn:
            print("Powered on")
            centralManager.scanForPeripherals(withServices: [CalendarPeripheral.calendarServiceUUID], options: [CBCentralManagerScanOptionAllowDuplicatesKey:true])
            break;
        case .poweredOff:
            print("poweredOff")
            break;
        default:
            print("Central is not powered on")
            break;
        }
    }
    
    
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        central.stopScan()
        self.peripheral = peripheral
        self.peripheral.delegate = self
        central.connect(peripheral)
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        if peripheral == self.peripheral {
            print("Connected to calendar")
            peripheral.discoverServices([CalendarPeripheral.calendarServiceUUID])
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let services = peripheral.services {
            for service in services {
                if service.uuid == CalendarPeripheral.calendarServiceUUID {
                    print("service found")
                    peripheral.discoverCharacteristics([CalendarPeripheral.calendarCharacteristicUUID], for: service)
                    return
                }
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let characteristics = service.characteristics {
            for characteristic in characteristics {
                if(characteristic.uuid == CalendarPeripheral.calendarCharacteristicUUID){
                    print("calendar characteristic found")
                }
            }
        }
    }
}
