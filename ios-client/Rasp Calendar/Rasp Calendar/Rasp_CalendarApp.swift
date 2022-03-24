//
//  Rasp_CalendarApp.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 11/11/21.
//

import SwiftUI

@main
struct Rasp_CalendarApp: App {
    @StateObject var raspPiInfo = RaspPi()
    
    var body: some Scene {
        WindowGroup {
            ZStack{
//                if !raspPiInfo.hasIP {
//                    ContentView()
//                } else {
                    RaspPiControllerView()
//                }
            }
            .environmentObject(raspPiInfo)
            
        }
    }
}
