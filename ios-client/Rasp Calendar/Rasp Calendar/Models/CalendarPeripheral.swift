//
//  CalendarPeripheral.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 3/22/22.
//

import Foundation
import CoreBluetooth

class CalendarPeripheral {
    public static let calendarServiceUUID = CBUUID.init(string: "aaa1")
    public static let calendarCharacteristicUUID = CBUUID.init(string: "aaa2")
}
