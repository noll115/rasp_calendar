//
//  UserModel.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 1/24/22.
//

import Foundation
import GoogleSignIn
import SwiftUI


class RaspPi: ObservableObject {
    
    @AppStorage("ipAddr") private(set) var IPAddr:URL?
    @Published private(set) var email:String? = nil
    @Published private(set) var currentViewMode: CalendarViewModes = .day
    @Published private(set) var socketStatus: RaspPiEvents = .disconnected
    private let googleAPI = GoogleApi()
    @Published private(set) var userStatus : UserStatus = .loggingIn
    private let socketManager = RaspPiSocketManager();
    
    var isConnected: Bool {
        get {
            if case .connected = socketStatus {
                return true
            }
            return false
        }
    }
    var isConnecting: Bool {
        get {
            if case .connecting = socketStatus {
                return true
            }
            return false
        }
    }
    
    var isDisconnected: Bool {
        get {
            if case .disconnected = socketStatus {
                return true
            }
            return false
        }
    }
    
    var hasIP: Bool {
        get {
            return IPAddr != nil
        }
    }
    
    @MainActor
    func connectToRaspPi(_ newIPAddr: String? = nil) async {
        guard case .loggedIn(let user) = self.userStatus else {
            return
        }
        let finalurl : URL
        if let newIPAddr = newIPAddr {
            guard let url = URL(string: "http://\(newIPAddr)") else {
                return
            }
            finalurl = url
        } else {
            guard let IPAddr = IPAddr else {
                return
            }
            finalurl = IPAddr
        }
        let socketEvents = socketManager.connectToRaspPi(finalurl,authToken:user.serverAuthCode)
        for await event in socketEvents {
            print(event)
            switch event {
            case .newViewMode(let newView):
                currentViewMode = newView
            case .connecting:
                socketStatus = .connecting
            case .connected:
                socketStatus = .connected
            case .connectError(let info):
                print("FAILED CONNECT",info)
                socketStatus = .disconnected
            case .disconnected:
                socketStatus = .disconnected
            }
        }
        print("END")
    }
    
    private func sendCalendarAction<T:CalendarActionBase>(_ action : T) {
        socketManager.sendCalendarAction(action)
    }
    

    func signIn(_ viewController:UIViewController) {
        self.userStatus = .loggingIn
        googleAPI.signIn(viewController) { user in
            guard let user = user else {
                self.userStatus = .loggedOut
                return
            }
            self.userStatus = .loggedIn(user)
        }
        
    }
    
    @MainActor
    func restoreUser() {
        Task {
            let user = await googleAPI.restoreLogin()
            guard let user = user else {
                self.userStatus = .loggedOut
                return
            }
            self.userStatus = .loggedIn(user)
        }
    }
    
    func signOut() {
        socketManager.logout()
        GIDSignIn.sharedInstance.signOut()
        self.userStatus = .loggedOut
    }
    
    func changeView() {
        let nextView: CalendarViewModes = self.currentViewMode == .day ? .month : .day
        sendCalendarAction(ChangeView(nextView))
        self.currentViewMode = nextView
    }
    
    
}

enum UserStatus {
    case loggedIn(GIDGoogleUser)
    case loggingIn
    case loggedOut
}
