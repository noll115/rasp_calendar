//
//  UserModel.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 1/24/22.
//

import Foundation

enum CalendarViewModes: String {
    case day
    case month
}

enum CalendarViewErrors:Error{
    case badURL
    case connectionError
}

class RaspPi: ObservableObject {
    
    @Published var IPAddr:String? = nil
    @Published var email:String? = nil
    
    func changeCalendarView(_ mode: CalendarViewModes) async throws {
        guard let IPAddr = IPAddr else {
            throw CalendarViewErrors.badURL
        }
        guard var urlComponents = URLComponents(string: IPAddr) else {
            throw CalendarViewErrors.badURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name:"mode",value: mode.rawValue)
        ]
        
        guard let url = urlComponents.url else {
            throw CalendarViewErrors.badURL
        }
        
        do{
            let (data,_) = try await URLSession.shared.data(from:url )
        }
    }
    
}
