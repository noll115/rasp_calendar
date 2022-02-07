//
//  SafariViewWrapper.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 1/26/22.
//

import Foundation
import SwiftUI
import SafariServices

struct SafariViewWrapper: UIViewControllerRepresentable{
    let url: URL
    
    func makeUIViewController(context: Context) -> some UIViewController {
        return SFSafariViewController(url:url)
    }
    
    func updateUIViewController(_ uiViewController: UIViewControllerType, context: Context) {
        return
    }
}
