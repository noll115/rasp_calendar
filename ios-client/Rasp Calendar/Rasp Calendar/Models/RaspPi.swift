//
//  UserModel.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 1/24/22.
//

import Foundation

enum CalendarViewModes: String , CaseIterable{
    case day
    case month
}

enum CalendarViewErrors:Error{
    case serverError
}

class RaspPi: ObservableObject {
    
    @Published private var IPAddr:String? = nil
    @Published private(set) var email:String? = nil
    @Published private(set) var currentViewMode: CalendarViewModes? = nil
    
    var hasIP: Bool {
        get {
            return IPAddr != nil
        }
    }
    
    
    
    func setIPAddr(_ newIPAddr: String) {
        guard URL(string: newIPAddr) != nil else {
            self.IPAddr = nil
            return
        }
        self.IPAddr = newIPAddr
    }
    
    func changeCalendarView(_ mode: CalendarViewModes) async throws {
        guard let IPAddr = IPAddr, var urlComponents = URLComponents(string: IPAddr) else {
            IPAddr = nil
            return
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name:"mode",value: mode.rawValue)
        ]
        
        guard let url = urlComponents.url else {
            self.IPAddr = nil
            return
        }
        
        
        let (data,res) = try await URLSession.shared.data(from:url)
        guard let res = res as? HTTPURLResponse, (200...299).contains(res.statusCode) else {
            throw CalendarViewErrors.serverError
        }
        
    }
    
    func syncCalendar() async throws {
        guard let IPAddr = IPAddr, let url = URL(string: IPAddr) else {
            self.IPAddr = nil
            return
        }
        
        let (data,res) = try await URLSession.shared.data(from: url)
        guard let res = res as? HTTPURLResponse, (200...299).contains(res.statusCode) else{
            throw CalendarViewErrors.serverError
        }
    }
    
}
