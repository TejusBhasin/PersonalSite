import { Plane, Radio, Camera, Compass, Map, Route, ClipboardList, BookOpen, Radar, Satellite } from "lucide-react";

export const FEED_COUNT = 6;

export const GROUPS = [
  {
    id: "track",
    label: "Track Flights",
    blurb: "Follow any aircraft that is in the air right now.",
    items: [
      {
        name: "FlightRadar24",
        url: "https://www.flightradar24.com/",
        host: "flightradar24.com",
        desc: "Live global flight tracking: aircraft type, route, altitude and speed.",
        icon: Radar,
      },
      {
        name: "FlightAware",
        url: "https://www.flightaware.com/",
        host: "flightaware.com",
        desc: "Flight status, arrivals and departures, and airport delays.",
        icon: Plane,
      },
      {
        name: "Planespotters Radar",
        url: "https://radar.planespotters.net/",
        host: "radar.planespotters.net",
        desc: "A live radar map with photo-backed aircraft identification.",
        icon: Satellite,
      },
    ],
  },
  {
    id: "listen",
    label: "Listen & Watch",
    blurb: "Tower audio and live airport cameras.",
    items: [
      {
        name: "LiveATC",
        url: "https://www.liveatc.net/",
        host: "liveatc.net",
        desc: "Live air traffic control audio from towers and centers worldwide.",
        icon: Radio,
      },
      {
        name: "AirportCameraLive",
        url: "https://airportwebcams.net/",
        host: "airportwebcams.net",
        desc: "Live airport webcams pointed straight at the runways.",
        icon: Camera,
      },
      {
        name: "Intelligent Camera Feeds",
        url: "https://www.flightradar24.com/blog/airport-live-streams/",
        host: "flightradar24.com",
        desc: "Flightradar24's curated airport live streams.",
        icon: Camera,
      },
    ],
  },
  {
    id: "plan",
    label: "Plan & Prepare",
    blurb: "Charts, airport data, and the checklist before you fly.",
    items: [
      {
        name: "FlightPlan (GOFLY-EFB)",
        url: "https://goflyefb.com/",
        host: "goflyefb.com",
        desc: "Plan real and simulator flights with route and fuel tools.",
        icon: Route,
      },
      {
        name: "General Flight Checklist",
        url: "https://docs.google.com/document/d/1bABbe_I4__wM1_avUk83T9Eb2kY4Vk0xlYYQ20jXEb8/edit?usp=sharing",
        host: "docs.google.com",
        desc: "The preflight checklist I actually run through, start to finish.",
        icon: ClipboardList,
      },
      {
        name: "SkyVector",
        url: "https://skyvector.com/",
        host: "skyvector.com",
        desc: "Enroute charts and airport data on a single map.",
        icon: Map,
      },
      {
        name: "AirportStats",
        url: "https://www.airnav.com/airports/",
        host: "airnav.com",
        desc: "Runways, frequencies, fuel and procedures for any airport.",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "spot",
    label: "Spot & Identify",
    blurb: "Put a registration and a photo on whatever just flew over.",
    items: [
      {
        name: "Aircraft Info And Images",
        url: "https://www.planespotters.net/",
        host: "planespotters.net",
        desc: "Photos, registrations and airframe histories for individual aircraft.",
        icon: Compass,
      },
    ],
  },
];

export const AI_LINKS = {
  chat: "https://avgeekai.zapier.app/chat",
  app: "https://avgeek.zapier.app/",
};

export const toolCount = GROUPS.reduce((total, group) => total + group.items.length, 0) + 1;