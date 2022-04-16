//
//  socketio.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 4/14/22.
//


import SocketIO
import AVFoundation
import Combine
class RaspPiSocketManager {
    
    let params = SocketIOClientConfiguration(arrayLiteral:.forceWebsockets(true),.reconnects(false))
    private(set) var socketManager: SocketManager?
    
    
    func connectToRaspPi(_ url: URL, authToken : String?) -> AsyncStream<RaspPiEvents>{
        return AsyncStream {
            continuation in
            socketManager = SocketManager(socketURL: url, config: params)
            
            guard let socket = socketManager?.defaultSocket else {
                continuation.finish()
                return
            }
            
            socket.on("newViewMode") { d,a in
                print(d[0])
                guard let str = d[0] as? String,let newView = CalendarViewModes.init(rawValue:str) else {return}
                continuation.yield(.newViewMode(newView))
            }
            socket.on(clientEvent:.connect) { d,a in
                continuation.yield(.connected)
                print("socket connected")
            }
            
            socket.on(clientEvent:.disconnect) { d,a in
                continuation.yield(.disconnected)
                continuation.finish()
                print("socket disconnect")
            }
            socket.on(clientEvent:.statusChange){ d,a in
                print("STATUS CHANGE")
                guard let statId = d[1] as? Int,let status = SocketIOStatus.init(rawValue: statId) else { return }
                if status == .connecting {
                    continuation.yield(.connecting)
                }
            }
            socket.on(clientEvent:.error){ d,a in
                print("ERROR")
                continuation.yield(.connectError(d))
                continuation.finish()
            }
            socket.connect(withPayload: ["token":authToken as Any],timeoutAfter: 4){
                continuation.yield(.disconnected)
                continuation.finish()
            }
            
        }
    }
    
    
    func sendCalendarAction<T:CalendarActionBase>(_ action : T) {
        guard let socket = socketManager?.defaultSocket else {
            return
        }
        if socket.status == .connected {
            socket.emit("action", action)
        }
    }
    
    func logout() {
        guard let socket = socketManager?.defaultSocket else { return }
        if socket.status == .connected {
            socket.emit("logout")
        }
        
    }
    
}

enum RaspPiEvents {
    case newViewMode(CalendarViewModes)
    case connecting
    case connected
    case disconnected
    case connectError(Any)
    
}


