//
//  QRCodeScannerView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 2/1/22.
//

import SwiftUI
import CodeScanner

struct QRCodeScannerView: View {
    
    @Binding var showCamera: Bool
    @EnvironmentObject var raspPi: RaspPi
    
#if targetEnvironment(simulator)
    @State var textStr = ""
#endif
    
    var body: some View {
        if !raspPi.isConnecting {
            ZStack(alignment: .bottom) {
                ipInput
                VStack {
                    Spacer()
                    Button{
                        showCamera = false
                    }label:{
                        Image(systemName: "xmark.circle")
                            .font(.system(size: 50))
                            .padding(.bottom)
                            .tint(.red)
                    }
                }
            }
        } else {
            ProgressView()
        }
    }
    
    var ipInput : some View {
#if targetEnvironment(simulator)
        Group{
            TextField("Calendar IP Address",text:$textStr)
                .padding()
                .onSubmit {
                    Task{
                        await raspPi.connectToRaspPi(textStr)
                    }
                }
                .onAppear{
                    textStr = String(raspPi.IPAddr?.absoluteString.dropFirst(7) ?? "")
                }
            
        }.frame( maxHeight: .infinity)
#else
        CodeScannerView(codeTypes: [.qr]){ response in
            switch response {
            case .success(let result):
                Task{
                    await raspPi.connectToRaspPi(result.string)
                }
                print(result.string)
            case .failure(let error):
                print(error.localizedDescription)
            }
            
        }.ignoresSafeArea()
#endif
    }
    
}

struct QRCodeScannerView_Previews: PreviewProvider {
    
    static var previews: some View {
        QRCodeScannerView(showCamera: .constant(true)).environmentObject(RaspPi())
    }
}
