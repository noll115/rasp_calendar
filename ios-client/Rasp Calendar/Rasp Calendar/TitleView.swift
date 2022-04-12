//
//  TitleView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/7/22.
//

import SwiftUI

struct TitleView: View {
    
    @Environment(\.colorScheme) var colorScheme
    
    let raspPiImage = Image("rasp_pi")
    
    private var raspIcon: some View {
        let img = raspPiImage
            .resizable()
            .scaledToFit()
        return colorScheme == .dark ? AnyView(img.colorInvert()) : AnyView(img)
    }
    
    var body: some View {
        HStack(alignment: .center){
            raspIcon
            Text("- Calendar")
                .padding(.trailing)
        }
        .frame( height: 70)
        .font(.system(size: 60))
    }
}

struct TitleView_Previews: PreviewProvider {
    static var previews: some View {
        TitleView()
    }
}
