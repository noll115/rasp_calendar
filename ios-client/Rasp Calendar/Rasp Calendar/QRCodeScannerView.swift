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
    
    var body: some View {
        ZStack(alignment: .bottom) {
//            CodeScannerView(codeTypes: [.qr]){ response in
//                switch response {
//                case .success(let result):
//                    let urlString = "http://\(result.string)"
//                    raspPi.setIPAddr(urlString)
//                    print(result.string)
//                case .failure(let error):
//                    print(error.localizedDescription)
//                }
//                
//            }.ignoresSafeArea()
            
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
