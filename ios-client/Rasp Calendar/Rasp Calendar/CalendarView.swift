//
//  CalendarView.swift
//  Rasp Calendar
//
//  Created by Noel Gomez on 2/7/22.
//

import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var raspPi: RaspPi
    @State var currentViewMode: CalendarViewModes
    
    var body: some View {
        HStack{
            Button("Switch Calendar Mode") {
                Task {
                    await updateCalendar()
                }
            }
        }
    }
    @MainActor
    func updateCalendar() async {
        let nextMode: CalendarViewModes = currentViewMode == .day ? .month : .day
        do {
            try await raspPi.changeCalendarView(nextMode)
        } catch {
          print(error)
        }
    }
}

struct CalendarView_Previews: PreviewProvider {
    static var previews: some View {
        CalendarView(currentViewMode: .month)
    }
}
