//
//  RaspPiControllerView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 2/1/22.
//

import SwiftUI
import AVFoundation

struct RaspPiControllerView: View {
    @State var showCamera = false
    @State var hasAccess = false
    @State var showQrBtn = false
    @EnvironmentObject var raspPi: RaspPi
    let namespace : Namespace.ID
    
    var body: some View {
        ZStack{
            VStack{
                Spacer()
                TitleView()
                    .matchedGeometryEffect(id: "title", in: namespace)
                Spacer()
                CalendarActionBtns
                Spacer()
            }
            if !raspPi.isConnected {
                QRButton
            }
        }
        
        .sheet(isPresented: $showCamera,onDismiss:{showCamera = false} ){
            QRCodeScannerView(showCamera: $showCamera)
        }
        .task {
            await reqCamera()
            await raspPi.connectToRaspPi()
        }
        .onReceive(raspPi.$socketStatus){ socketStatus in
            if raspPi.isConnected {
                showCamera = false
            }
            
        }
        
        
        
    }
    
    @MainActor
    func reqCamera() async {
        let access = await AVCaptureDevice.requestAccess(for: .video)
        hasAccess = access
    }
    
    private var QRButton: some View {
        VStack {
            HStack {
                Spacer()
                Button {
                    raspPi.signOut()
                } label: {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.title)
                }
                .frame(width: 70, height: 70)
            }
            .padding(.trailing)
            Spacer()
            HStack {
                Button {
                    showCamera = true
                } label: {
                    if !raspPi.isConnecting {
                        Label("Scan QR Code", systemImage: "qrcode").padding()
                    } else {
                        ProgressView().padding()
                    }
                    
                }
                .buttonStyle(.borderedProminent)
                .clipShape(Capsule())
                .disabled(raspPi.isConnecting)
                
                
            }
            
        }
    }
    
    private var CalendarActionBtns: some View {
        Group{
            Button("Change view"){
                raspPi.changeView()
            }
            .padding()
            Button("Refresh"){
                Task{
                    
                }
            }
            .padding()
            
        }
        .disabled(!raspPi.isConnected)
    }
    
}

struct RaspPiControllerView_Previews: PreviewProvider {
    @Namespace static var namespace
    static var previews: some View {
        Group {
            RaspPiControllerView(namespace: namespace)
                .environmentObject(RaspPi())
        }
    }
}
