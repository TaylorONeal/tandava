import type { ScheduleRow } from "@/components/marketing/primitives";

/**
 * The example class board on marketing pages. Labelled as an example where
 * shown. Names are made up; times and class types are what a small yoga and
 * pilates studio actually runs on a weekday.
 */
export const EXAMPLE_DAY: { day: string; place: string; rows: ScheduleRow[] } = {
  day: "Tuesday",
  place: "East studio",
  rows: [
    { time: "6:30 am", name: "Morning Vinyasa", teacher: "Lena Okafor", room: "Studio A", spots: 4 },
    { time: "9:15 am", name: "Slow Flow", teacher: "Tomás Rivera", spots: 11 },
    { time: "12:00 pm", name: "Mat Pilates", teacher: "Hana Mori", room: "Studio B", spots: 0 },
    { time: "5:45 pm", name: "Power Vinyasa", teacher: "Dev Malhotra", room: "Studio A", spots: 2 },
    { time: "7:30 pm", name: "Yin and Breath", teacher: "Ruth Abernathy", spots: 9 },
  ],
};
