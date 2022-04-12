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
            QRButton
        }
        .sheet(isPresented: $showCamera,onDismiss:{showCamera = false} ){
            QRCodeScannerView(showCamera: $showCamera)
        }
        .task {
            await reqCamera()
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
                    Task {
                        await raspPi.signOut()
                    }
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
                    Label("Scan QR Code", systemImage: "qrcode")
                        .padding()
                }
                .buttonStyle(.borderedProminent)
                .clipShape(Capsule())
                
            }

        }
    }
    
    private var CalendarActionBtns: some View {
        Group{
            Button("Change view"){
                Task {
                    await raspPi.changeView()
                }
            }
            .padding()
            Button("Refresh"){
                Task{
                    
                }
            }
            .padding()
            
        }
        .disabled(!raspPi.connected)
        .task {
            let _ = await raspPi.connectToRaspPi()
        }
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
