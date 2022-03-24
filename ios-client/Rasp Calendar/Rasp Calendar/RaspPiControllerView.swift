//
//  RaspPiControllerView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 2/1/22.
//

import SwiftUI

struct RaspPiControllerView: View {
    
    @EnvironmentObject var raspPi: RaspPi
    @State var synced = false
    var body: some View {
        
        if(synced){
            
        } else {
            ProgressView()
                .task {
                    await syncWithCalendar()
                }
        }
    }
    @MainActor
    func syncWithCalendar() async {
        do{
            try await raspPi.syncCalendar()
            self.synced = true
        } catch {
            print(error)
        }
        
    }
}

struct RaspPiControllerView_Previews: PreviewProvider {
    static var previews: some View {
        RaspPiControllerView()
    }
}
