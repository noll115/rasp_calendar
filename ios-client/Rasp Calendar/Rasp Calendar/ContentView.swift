//
//  ContentView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 11/11/21.
//

import SwiftUI
import AVFoundation

struct ContentView: View {
    @State var showCamera = false
    @Environment(\.colorScheme) var colorScheme
    
    let raspPi = Image("rasp_pi")
    
    
    private func raspIcon() -> some View {
        let img = raspPi
            .resizable()
            .scaledToFit()
        return colorScheme == .dark ? AnyView(img.colorInvert()) : AnyView(img)
    }
    
    var body: some View {
        VStack{
            Spacer()
            HStack(alignment: .center){
                raspIcon()
                Text("- Calendar")
                    .padding(.trailing)
            }
            .frame( height: 70)
            .font(.system(size: 60))
            
            Spacer()
            Button{
                Task{
                    await reqCamera($showCamera)
                }
                showCamera.toggle()
            }label: {
                Text("Scan qr code")
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            Spacer()
        }
        .sheet(isPresented: $showCamera,onDismiss:{showCamera = false} ){
            QRCodeScannerView(showCamera: $showCamera)
        }
        .navigationBarBackButtonHidden(true)
        
    }
    
    @MainActor
    func reqCamera(_ hasAccess : Binding<Bool>) async {
        let access = await AVCaptureDevice.requestAccess(for: .video)
        hasAccess.wrappedValue = access
    }
    
}


struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
        
    }
}
