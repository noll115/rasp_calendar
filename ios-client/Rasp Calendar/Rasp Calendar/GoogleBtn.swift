//
//  GoogleBtn.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/5/22.
//

import SwiftUI
import GoogleSignIn

struct GoogleBtn: UIViewRepresentable {
    func makeUIView(context: Context) -> some UIView {
        let btn = GIDSignInButton(frame: .zero)
        return btn
    }
    
    func updateUIView(_ uiView: UIViewType, context: Context) {
        return
    }
    
}

struct GoogleBtn_Previews: PreviewProvider {
    static var previews: some View {
        GoogleBtn()
    }
}
