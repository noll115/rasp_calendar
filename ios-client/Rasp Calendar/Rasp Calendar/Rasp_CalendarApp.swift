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
    
    @StateObject var raspPi = RaspPi()
    @Environment(\.scenePhase) private var scenePhase
    
    @Namespace var namespace
    
    var body: some Scene {
        WindowGroup {
            VStack {
                if raspPi.isLoggedIn {
                    RaspPiControllerView(namespace: namespace)
                } else {
                    ContentView(namespace: namespace)
                }
            }
            .environmentObject(raspPi)
            .onOpenURL{ url in
                print("RESTORE")
                GIDSignIn.sharedInstance.handle(url)
            }
            .onAppear{
                GIDSignIn.sharedInstance.restorePreviousSignIn {
                     user, error in
                    if error != nil || user == nil {
                        print("NO USER")
                    } else {
                        raspPi.setUser(user!)
                        print("HAD USER")
                    }

                }
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
