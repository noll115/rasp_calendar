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
        ZStack(alignment: .bottom) {
#if targetEnvironment(simulator)
            Group{
                TextField("Calendar IP Address",text:$textStr)
                    .padding()
                    .onSubmit {
                        Task{
                            if await raspPi.connectToRaspPi(textStr) {
                                showCamera = false
                            }
                        }
                    }
                
            }.frame( maxHeight: .infinity)
#else
            CodeScannerView(codeTypes: [.qr]){ response in
                switch response {
                case .success(let result):
                    Task{
                        if await raspPi.connectToRaspPi(result.string) {
                            showCamera = false
                        }
                    }
                    print(result.string)
                case .failure(let error):
                    print(error.localizedDescription)
                }
                
            }.ignoresSafeArea()
#endif
            
            
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
    }
    
}

struct QRCodeScannerView_Previews: PreviewProvider {
    
    static var previews: some View {
        QRCodeScannerView(showCamera: .constant(true))
    }
}
