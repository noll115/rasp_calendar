//
//  CalendarAction.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/6/22.
//

import Foundation
import SocketIO


enum CalendarActionType : String,Encodable {
    case changeView
    case refresh
}

protocol CalendarActionBase : SocketData {
    var type: CalendarActionType {get}
}


struct ChangeView : CalendarActionBase {
    var type  = CalendarActionType.changeView
    var body : Body
    
    struct Body : SocketData {
        var viewMode: CalendarViewModes
        func socketRepresentation() throws -> SocketData {
            return ["viewMode" : viewMode.rawValue]
        }
    }
    
    init(_ mode : CalendarViewModes) {
        body = Body(viewMode: mode)
    }
    
    func socketRepresentation() throws -> SocketData {
        let body = try! self.body.socketRepresentation()
        return ["type": type.rawValue, "body" : body]
    }
    
}

struct Refresh : CalendarActionBase {
    var type = CalendarActionType.refresh
    init(){}
}

struct ConnectToPiResponse : Decodable {
    var viewMode:CalendarViewModes
}


enum CalendarViewModes: String, CaseIterable, Codable{
    case day
    case month
}
