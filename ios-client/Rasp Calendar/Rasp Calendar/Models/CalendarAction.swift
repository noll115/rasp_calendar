//
//  CalendarAction.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/6/22.
//

import Foundation


enum CalendarActionType : String,Encodable {
    case changeView
    case refresh
}



protocol CalendarActionBase : Encodable {
    var type: CalendarActionType {get}
}


struct ChangeView : CalendarActionBase {
    var type  = CalendarActionType.changeView
    var body : Body
    
    struct Body : Encodable {
        var viewMode: CalendarViewModes
    }
    
    init(_ mode : CalendarViewModes) {
        body = Body(viewMode: mode)
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
