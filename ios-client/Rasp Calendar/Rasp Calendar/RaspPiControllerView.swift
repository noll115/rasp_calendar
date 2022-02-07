//
//  RaspPiControllerView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 2/1/22.
//

import SwiftUI

struct RaspPiControllerView: View {
    
    @EnvironmentObject var raspPiObj: RaspPi
    @State var hasConnected = false
    
    var body: some View {
        ProgressView()
            .onAppear{
                
            }
            
    }
}

struct RaspPiControllerView_Previews: PreviewProvider {
    static var previews: some View {
        RaspPiControllerView()
    }
}
