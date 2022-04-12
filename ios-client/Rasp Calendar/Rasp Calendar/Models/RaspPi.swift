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
    
    var signInConfig = GIDConfiguration.init(
        clientID:"1053220613803-h55ooeocg61800m3dn67gpn41n4ju740.apps.googleusercontent.com",
        serverClientID: "1053220613803-9jht04b31glessdm46ofnsne153idi0r.apps.googleusercontent.com"
    )
    let scope = "https://www.googleapis.com/auth/calendar.readonly"
    @AppStorage("ipAddr") private(set) var IPAddr:URL?
    @Published private(set) var email:String? = nil
    @Published private(set) var currentViewMode: CalendarViewModes = .day
    @Published private(set) var connected = false
    @Published private(set) var user : GIDGoogleUser?
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    var hasIP: Bool {
        get {
            return IPAddr != nil
        }
    }
    var isLoggedIn : Bool {
        get{
            return user != nil
        }
    }
    
    
    @MainActor
    func connectToRaspPi(_ newIPAddr: String? = nil) async -> Bool {
        guard let user = user else {
            return false
        }
        do {
            print("CONNECTING")
            let finalurl : URL
            if let newIPAddr = newIPAddr {
                guard let url = URL(string: "http://\(newIPAddr)") else {
                    return false
                }
                finalurl = url
            } else {
                guard let IPAddr = IPAddr else {
                    return false
                }
                finalurl = IPAddr
            }
            var request = URLRequest(url: finalurl.appendingPathComponent("login"))
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpMethod = "POST"
            
            guard let encoded = try? encoder.encode(user.serverAuthCode ?? nil) else {
                print("Failed to encode")
                return false
            }
            
            let (data,res) = try await URLSession.shared.upload(for: request, from: encoded)
            guard let res = res as? HTTPURLResponse, (200...299).contains(res.statusCode) else {
                throw CalendarViewErrors.serverError
            }
            guard let res = try? decoder.decode(ConnectToPiResponse.self, from: data) else {
                print("FAILED DECODE")
                return false
            }
            self.currentViewMode = res.viewMode
            if newIPAddr != nil {
                self.IPAddr = finalurl
            }
            self.connected = true
            print("connected")
            return true
        } catch {
            print(error.localizedDescription)
            self.IPAddr = nil
            self.connected = false
            return false
        }
    }
    
    private func sendCalendarAction<T:CalendarActionBase>(_ action : T) async {
        do{
            guard let IPAddr = IPAddr else {
                print("NO IP")
                self.connected = false
                return
            }
            var req = URLRequest(url: IPAddr.appendingPathComponent("/action"))
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpMethod = "POST"
            guard let body = try? JSONEncoder().encode(action) else {
                print("FAILED ENCODING")
                return
            }
            print(action)
            let (_,res) = try await URLSession.shared.upload(for:req, from:body)
            guard let res = res as? HTTPURLResponse, (200...299).contains(res.statusCode) else {
                self.connected = false
                self.IPAddr = nil
                return
            }
        } catch {
            print(error)
            self.IPAddr = nil
            self.connected = false
        }
    }
    
    @MainActor
    func signIn(_ viewController:UIViewController) {
        print("PRINT")
        GIDSignIn.sharedInstance.signIn(with: signInConfig, presenting:viewController ){
            user, error in
            print("try")
            
            guard let user = user, error == nil else {
                print(error!.localizedDescription)
                return
            }
            print(user.grantedScopes!)
            if user.grantedScopes == nil || !user.grantedScopes!.contains(self.scope) {
                GIDSignIn.sharedInstance.addScopes([self.scope], presenting: viewController){
                    user,error in
                    print("user")
                    
                    guard let user = user,error == nil else {
                        print(error!.localizedDescription)
                        return
                    }
                    self.setUser(user)
                }
                return
            }
            
            print("user created")
            self.setUser(user)
        }
    }
    
    @MainActor
    func signOut() async {
        if IPAddr != nil {
            var req = URLRequest(url: IPAddr!.appendingPathComponent("/logout"))
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpMethod = "POST"
            do {
                let _ = try await URLSession.shared.upload(for:req, from:Data())
            } catch {
                print("FAILED LOGOUT")
            }
        }
        GIDSignIn.sharedInstance.signOut()
        setUser(nil)
    }
    
    func setUser(_ user: GIDGoogleUser?){
        withAnimation{
            self.user = user
        }
    }
    
    @MainActor
    func changeView() async {
        let nextView: CalendarViewModes = self.currentViewMode == .day ? .month : .day
        await sendCalendarAction(ChangeView(nextView))
        self.currentViewMode = nextView
    }
    
    
}

enum CalendarViewErrors:Error{
    case serverError
    case invalidIPAddress
}
