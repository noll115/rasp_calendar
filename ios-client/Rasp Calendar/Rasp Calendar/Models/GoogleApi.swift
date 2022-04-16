//
//  GoogleApi.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/15/22.
//

import Foundation
import GoogleSignIn

class GoogleApi {
    
    var signInConfig = GIDConfiguration.init(
        clientID:"1053220613803-h55ooeocg61800m3dn67gpn41n4ju740.apps.googleusercontent.com",
        serverClientID: "1053220613803-9jht04b31glessdm46ofnsne153idi0r.apps.googleusercontent.com"
    )
    let scope = "https://www.googleapis.com/auth/calendar.readonly"
    
    func restoreLogin() async -> GIDGoogleUser? {
        return await withCheckedContinuation { continuation in
            GIDSignIn.sharedInstance.restorePreviousSignIn {
                user, error in
                if error != nil || user == nil {
                    continuation.resume(returning: nil)
                    print("NO USER")
                } else {
                    continuation.resume(returning: user!)
                    print("HAD USER")
                }
                
            }
        }
    }
    
    func signIn(_ viewController:UIViewController, cb: @escaping (GIDGoogleUser?)->Void) {
            GIDSignIn.sharedInstance.signIn(with: signInConfig, presenting: viewController ){
                user, error in
                
                guard let user = user, error == nil else {
                    print(error!.localizedDescription)
                    return cb(nil)
                }
                print(user.grantedScopes!)
                if user.grantedScopes == nil || !user.grantedScopes!.contains(self.scope) {
                    GIDSignIn.sharedInstance.addScopes([self.scope], presenting: viewController){
                        user,error in
                        guard let user = user,error == nil else {
                            print(error!.localizedDescription)
                            return cb(nil)
                        }
                        cb(user)
                    }
                } else {
                    cb(user)
                }
            }
    }
}
