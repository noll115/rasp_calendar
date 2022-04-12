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
    var namespace : Namespace.ID
    
    var body: some View {
        VStack{
            Spacer()
            TitleView()
                .matchedGeometryEffect(id: "title", in: namespace,isSource: true)
            Spacer()
            Spacer()
            Button{
                raspPi.signIn(getRootViewController())
            }label: {
                Text("Login")
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            Spacer()
        }
        
        
    }
    
    
}



struct ContentView_Previews: PreviewProvider {
    @Namespace static var namespace
    static var previews: some View {
        ContentView(namespace: namespace)
        
    }
}
