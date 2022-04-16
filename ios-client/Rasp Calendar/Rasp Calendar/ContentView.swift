//
//  ContentView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 11/11/21.
//

import SwiftUI
import GoogleSignIn

struct ContentView: View {
    @EnvironmentObject var raspPi: RaspPi
    @Namespace var namespace
    @State var showControllerView = false
    
    var body: some View {
        VStack {
            if showControllerView{
                RaspPiControllerView(namespace: namespace)
            } else {
                LoginView(namespace: namespace)
            }
        }
        .onReceive(raspPi.$userStatus){ userStatus in
            guard case .loggedIn = userStatus else {
                withAnimation{
                    showControllerView = false
                }
                return
            }
            withAnimation{
                showControllerView = true
            }
        }
        
    }
    
    
}



struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
        
    }
}
