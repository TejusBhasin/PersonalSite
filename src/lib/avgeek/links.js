import { Plane, Radio, Camera, Compass, Map, Route, ClipboardList, BookOpen, Radar, Satellite } from "lucide-react";

export const FEED_COUNT = 6;

const IMAGES = "https://media.base44.com/images/public/6a29e04307b892bb19072d29/";

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
        image: `${IMAGES}8259f8fbdcc3f24a10f19252fe547c48_generated_image.png`,
      },
      {
        name: "FlightAware",
        url: "https://www.flightaware.com/",
        host: "flightaware.com",
        desc: "Flight status, arrivals and departures, and airport delays.",
        icon: Plane,
        image: `${IMAGES}901bbd5a6298643e1d6c59066c59928a_generated_image.png`,
      },
      {
        name: "Planespotters Radar",
        url: "https://radar.planespotters.net/",
        host: "radar.planespotters.net",
        desc: "A live radar map with photo-backed aircraft identification.",
        icon: Satellite,
        image: `${IMAGES}e036d4343ff60c12ccb1999eac66527e_generated_image.png`,
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
        image: `${IMAGES}72832adabe1e2ffb058939597498933e_generated_image.png`,
      },
      {
        name: "AirportCameraLive",
        url: "https://airportwebcams.net/",
        host: "airportwebcams.net",
        desc: "Live airport webcams pointed straight at the runways.",
        icon: Camera,
        image: `${IMAGES}704798ef77dca0abb2a65cf8573f9cd5_generated_image.png`,
      },
      {
        name: "Intelligent Camera Feeds",
        url: "https://www.flightradar24.com/blog/airport-live-streams/",
        host: "flightradar24.com",
        desc: "Flightradar24's curated airport live streams.",
        icon: Camera,
        image: `${IMAGES}ba8d9349fcbcb5c90cd190db5f72e931_generated_image.png`,
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
        image: `${IMAGES}db161b91b770458d949a8d94b5071d55_generated_image.png`,
      },
      {
        name: "General Flight Checklist",
        url: "https://docs.google.com/document/d/1bABbe_I4__wM1_avUk83T9Eb2kY4Vk0xlYYQ20jXEb8/edit?usp=sharing",
        host: "docs.google.com",
        desc: "The preflight checklist I actually run through, start to finish.",
        icon: ClipboardList,
        image: `${IMAGES}571fe04b9fb236e67744d23bb4c46aaa_generated_image.png`,
      },
      {
        name: "SkyVector",
        url: "https://skyvector.com/",
        host: "skyvector.com",
        desc: "Enroute charts and airport data on a single map.",
        icon: Map,
        image: `${IMAGES}effb670d108d2f8fa9c23f6499b75e01_generated_image.png`,
      },
      {
        name: "AirportStats",
        url: "https://www.airnav.com/airports/",
        host: "airnav.com",
        desc: "Runways, frequencies, fuel and procedures for any airport.",
        icon: BookOpen,
        image: `${IMAGES}228991955d2c3464bb3dc78ab1848785_generated_image.png`,
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
        image: `${IMAGES}5309a0bcccec561dbf741754e3a16c92_generated_image.png`,
      },
    ],
  },
];

export const AI_LINKS = {
  chat: "https://avgeekai.zapier.app/chat",
  app: "https://avgeek.zapier.app/",
};

export const toolCount = GROUPS.reduce((total, group) => total + group.items.length, 0) + 1;