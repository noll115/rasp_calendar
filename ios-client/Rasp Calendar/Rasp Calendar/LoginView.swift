//
//  LoginView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/15/22.
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var raspPi: RaspPi
    @State var loading = true
    var namespace : Namespace.ID
    
    var body: some View {
        VStack{
            Spacer()
            TitleView()
                .matchedGeometryEffect(id: "title", in: namespace)
            Spacer()
            Spacer()
            
            Button{
                raspPi.signIn(getRootViewController())
            }label: {
                Text("Login")
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .opacity(loading ? 0 : 1)
            Spacer()
        }
        .onReceive(raspPi.$userStatus) { val in
            switch val {
            case .loggedOut:
                loading = false
                break
            case .loggedIn,.loggingIn:
                break
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    @Namespace static var namespace
    static var previews: some View {
        LoginView(namespace: namespace)
    }
}
