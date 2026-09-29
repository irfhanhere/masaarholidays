export interface ItineraryDay {
  day: number | string;
  title: string;
  desc: string;
  icon?: string;
}

/**
 * Generate a realistic, professionally sequenced pilgrimage itinerary
 * tailored exactly to the specified duration (e.g. 10 days, 7 days, 14 days, 4 days).
 */
export function generateItineraryForDays(totalDays: number, isHajj: boolean = false): ItineraryDay[] {
  const days = Math.max(1, Number(totalDays) || 4);

  if (isHajj) {
    if (days <= 5) {
      return [
        {
          day: 1,
          title: "Day 1: Arrival in Holy Makkah & Welcome",
          desc: "Arrival at King Abdulaziz International Airport (JED), meet & assist, private transfer to Makkah hotel, check-in and briefing.",
          icon: "✈️",
        },
        {
          day: 2,
          title: "Day 2: Yawm At-Tarwiyah (Mina)",
          desc: "Transition to Mina VIP air-conditioned tents. Prayers and preparation for the great day of Arafat.",
          icon: "⛺",
        },
        {
          day: 3,
          title: "Day 3: Day of Arafat & Muzdalifah",
          desc: "Stand on the plains of Arafat for Wuquf and du'as until sunset, followed by overnight stay in Muzdalifah.",
          icon: "🤲",
        },
        {
          day: 4,
          title: "Day 4: Eid Day & Ramy Al-Jamarat",
          desc: "Stoning of Jamarat Al-Aqaba, Qurbani sacrifice, Halq/Taqseer, and Tawaf Al-Ifadah at Masjid Al Haram.",
          icon: "🕋",
        },
        {
          day: 5,
          title: `Day ${days}: Tawaf Al-Wada & Farewell Departure`,
          desc: "Farewell circumambulation (Tawaf Al-Wada) and private transfer to airport for safe return flight.",
          icon: "✈️",
        },
      ];
    }

    const hajjResult: ItineraryDay[] = [
      {
        day: 1,
        title: "Day 1: Arrival & Check-in",
        desc: "VIP arrival, private transfer to 5-star hotel in Makkah, orientation with scholar guide.",
        icon: "✈️",
      },
    ];

    for (let d = 2; d < Math.min(days - 4, 6); d++) {
      hajjResult.push({
        day: d,
        title: `Day ${d}: Makkah Prayers & Spiritual Preparation`,
        desc: "Congregational prayers at Masjid Al Haram and educational Hajj seminars with scholar guides.",
        icon: "🕋",
      });
    }

    const minaStart = Math.max(hajjResult.length + 1, days - 4);
    hajjResult.push({
      day: minaStart,
      title: `Day ${minaStart}: Yawm At-Tarwiyah (Mina)`,
      desc: "Move to air-conditioned Mina tents; day of prayer, reflection, and preparation.",
      icon: "⛺",
    });
    hajjResult.push({
      day: minaStart + 1,
      title: `Day ${minaStart + 1}: The Blessed Day of Arafat`,
      desc: "Wuquf at Mount of Mercy in Arafat, supplication, followed by Muzdalifah overnight under open sky.",
      icon: "🤲",
    });
    hajjResult.push({
      day: minaStart + 2,
      title: `Day ${minaStart + 2}: Eid Day, Jamarat & Tawaf Ifadah`,
      desc: "Ramy Al-Jamarat, animal sacrifice, Halq, and Tawaf Al-Ifadah at the Holy Kaaba.",
      icon: "🕋",
    });
    hajjResult.push({
      day: days,
      title: `Day ${days}: Tawaf Al-Wada & Return Journey`,
      desc: "Final farewell prayers, private transfer to airport, and safe return home with accepted Hajj.",
      icon: "✈️",
    });

    return hajjResult;
  }

  // Umrah Journeys
  if (days === 1) {
    return [
      {
        day: 1,
        title: "Day 1: Arrival & Holy Umrah",
        desc: "Arrival at King Abdulaziz International Airport (JED), private transfer to Makkah hotel, check-in, and performing Holy Umrah at Masjid Al Haram.",
        icon: "🕋",
      },
    ];
  }

  if (days === 2) {
    return [
      {
        day: 1,
        title: "Day 1: Arrival & Holy Umrah",
        desc: "VIP arrival, private transfer to Makkah hotel, check-in, and performing Holy Umrah.",
        icon: "✈️",
      },
      {
        day: 2,
        title: "Day 2: Farewell & Return",
        desc: "Final prayers at Masjid Al Haram, private transfer to Jeddah Airport, and return flight.",
        icon: "✈️",
      },
    ];
  }

  if (days === 3) {
    return [
      {
        day: 1,
        title: "Day 1: Arrival & Holy Umrah",
        desc: "Arrival at Jeddah Airport, private transfer to Makkah hotel, check-in, and performing Holy Umrah.",
        icon: "✈️",
      },
      {
        day: 2,
        title: "Day 2: Holy Makkah Devotions & Ziyarat",
        desc: "Congregational prayers at Haram and guided tour of sacred historical landmarks in Makkah.",
        icon: "🕋",
      },
      {
        day: 3,
        title: "Day 3: Farewell Tawaf & Return",
        desc: "Tawaf Al-Wada, private transfer to King Abdulaziz Airport, and return flight.",
        icon: "✈️",
      },
    ];
  }

  if (days === 4) {
    return [
      {
        day: 1,
        title: "Day 1: Arrival & Holy Umrah",
        desc: "Arrival at King Abdulaziz Airport (JED), private transfer to Makkah hotel, check-in, and performing Holy Umrah.",
        icon: "✈️",
      },
      {
        day: 2,
        title: "Day 2: Holy Makkah Devotions",
        desc: "Daily prayers and continuous worship in Masjid Al Haram, supplication at the Kaaba.",
        icon: "🕋",
      },
      {
        day: 3,
        title: "Day 3: Sacred Sites & Historical Ziyarat",
        desc: "Guided private tour of Jabal Al Noor (Cave Hira), Mount Thawr, Mina and Arafat.",
        icon: "🕋",
      },
      {
        day: 4,
        title: "Day 4: Farewell & Return Flight",
        desc: "Farewell prayers at Haram, private transfer to airport, and safe return flight.",
        icon: "✈️",
      },
    ];
  }

  // For 5 or more days (e.g. 7, 10, 12, 14 days):
  // Split smoothly between Makkah and Madinah with high-speed rail transit!
  const makkahDays = Math.ceil(days * 0.5); // e.g. 5 days for 10-day trip
  const result: ItineraryDay[] = [];

  // Day 1: Arrival & Umrah
  result.push({
    day: 1,
    title: "Day 1: Arrival & Holy Umrah",
    desc: "Arrival at King Abdulaziz Airport (JED), VIP meet & assist, private transfer to Makkah hotel, check-in, and performing Holy Umrah with scholar guidance.",
    icon: "✈️",
  });

  // Makkah intermediate days
  for (let d = 2; d < makkahDays; d++) {
    if (d === 2) {
      result.push({
        day: d,
        title: `Day ${d}: Holy Makkah Devotions`,
        desc: "Congregational prayers, Tawaf, Quran recitation, and spiritual contemplation at Masjid Al Haram.",
        icon: "🕋",
      });
    } else if (d === 3) {
      result.push({
        day: d,
        title: `Day ${d}: Sacred Sites & Historical Ziyarat`,
        desc: "Guided private tour visiting Jabal Al Noor (Cave Hira), Mount Thawr, Mina, and the sacred plains.",
        icon: "🕋",
      });
    } else {
      result.push({
        day: d,
        title: `Day ${d}: Spiritual Devotions in Makkah`,
        desc: "Peaceful worship at the Kaaba, personal du'as at the Multazam, and continuous spiritual study.",
        icon: "🕋",
      });
    }
  }

  // Train Transit to Madinah
  const trainDay = makkahDays;
  result.push({
    day: trainDay,
    title: `Day ${trainDay}: Haramain High-Speed Train to Madinah`,
    desc: "Board the luxury Haramain Bullet Train to Madinah Munawwarah. Hotel check-in & initial Salam at Prophet's Mosque.",
    icon: "🚄",
  });

  // Madinah days
  for (let d = trainDay + 1; d < days; d++) {
    const madinahIndex = d - trainDay;
    if (madinahIndex === 1) {
      result.push({
        day: d,
        title: `Day ${d}: Madinah Munawwarah & Prophet's Mosque`,
        desc: "Congregational prayers in Masjid An-Nabawi and peaceful contemplation in the blessed city.",
        icon: "🕌",
      });
    } else if (madinahIndex === 2) {
      result.push({
        day: d,
        title: `Day ${d}: Rawdah Sharif Visit & Salam`,
        desc: "Guaranteed permit assistance for prayer and Salam in the blessed Riyadh Al Jannah (Rawdah Sharif).",
        icon: "🕌",
      });
    } else if (madinahIndex === 3) {
      result.push({
        day: d,
        title: `Day ${d}: Madinah Sacred Historical Ziyarat`,
        desc: "Guided visit to Masjid Quba (first mosque in Islam), Mount Uhud martyrs cemetery, and Seven Mosques.",
        icon: "🕌",
      });
    } else {
      result.push({
        day: d,
        title: `Day ${d}: Worship & Solace in Madinah`,
        desc: "Spiritual reflection, remembrance, and supplication within the serene precincts of the Prophet's Mosque.",
        icon: "🕌",
      });
    }
  }

  // Last Day: Departure
  result.push({
    day: days,
    title: `Day ${days}: Farewell & Return Flight`,
    desc: "Farewell prayers, private airport transfer to Prince Mohammad Bin Abdulaziz Airport (MED), and safe return flight with accepted pilgrimage.",
    icon: "✈️",
  });

  return result;
}
