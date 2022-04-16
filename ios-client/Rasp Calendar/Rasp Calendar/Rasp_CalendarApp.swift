//
//  Rasp_CalendarApp.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 11/11/21.
//

import SwiftUI
import GoogleSignIn
@main
struct Rasp_CalendarApp: App {
    
    @StateObject var raspPi: RaspPi = RaspPi()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
            .environmentObject(raspPi)
            .onAppear{
                raspPi.restoreUser()
            }
        }
        
    }
}



extension View {
    
    func getRootViewController() -> UIViewController {
        guard let screen = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return .init()
        }
        
        guard let root = screen.windows.first?.rootViewController else {
            return .init()
        }
        return root
    }
}
