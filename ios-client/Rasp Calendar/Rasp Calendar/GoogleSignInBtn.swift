//
//  GoogleSignInBtn.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/5/22.
//

import SwiftUI
import GoogleSignIn

struct GoogleSignInBtn: UIViewControllerRepresentable {
    
    let signInConfig: GIDConfiguration?
    
    func makeUIViewController(context: Context) -> UIViewController {
        return UIViewController()
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        
    }
    
    func signIn(){
        
    }
    
    
}

struct GoogleSignInBtn_Previews: PreviewProvider {
    static var previews: some View {
        GoogleSignInBtn(signInConfig: nil)
    }
}
