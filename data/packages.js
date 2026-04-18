/**
 * Central predefined travel packages for Ashtadisha booking.
 * Loaded before checkout; merged into catalog by booking-checkout.js
 */
(function () {
  'use strict';

  window.AshtaPredefinedPackages = [
    {
      id: 'ne-classic-assam-meghalaya',
      title: 'Assam & Meghalaya Classic',
      price: 42500,
      duration: '7 Days / 6 Nights',
      description:
        'Kaziranga wildlife, Shillong hills, living root bridges, and Cherrapunji waterfalls — the perfect first taste of the Northeast.',
      image:
        'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
      destination: 'Assam & Meghalaya',
      source: 'PREDEFINED'
    },
    {
      id: 'ne-seven-sisters-grand',
      title: 'Seven Sisters Grand Circuit',
      price: 89000,
      duration: '14 Days / 13 Nights',
      description:
        'A sweeping route across all seven states: heritage, tribes, tea gardens, monasteries, and mountain passes with expert pacing.',
      image:
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      destination: 'All 7 States',
      source: 'PREDEFINED'
    },
    {
      id: 'ne-arunachal-tawang-saga',
      title: 'Arunachal Tawang & Sela Pass',
      price: 58500,
      duration: '9 Days / 8 Nights',
      description:
        'Tawang Monastery, Sela Pass high-altitude drama, Monpa culture, and pristine Himalayan valleys with ILP guidance.',
      image:
        'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
      destination: 'Arunachal Pradesh',
      source: 'PREDEFINED'
    },
    {
      id: 'ne-nagaland-hornbill-week',
      title: 'Nagaland Hornbill Experience',
      price: 36000,
      duration: '5 Days / 4 Nights',
      description:
        'Timed around festival energy: Kohima heritage, tribal villages, Dzükou Valley option, and Naga cuisine immersions.',
      image:
        'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
      destination: 'Nagaland',
      source: 'PREDEFINED'
    },
    {
      id: 'ne-sikkim-darjeeling-mountains',
      title: 'Sikkim & Darjeeling Tea Hills',
      price: 48000,
      duration: '8 Days / 7 Nights',
      description:
        'Gangtok monasteries, Tsomgo Lake, Pelling views of Kangchenjunga, and colonial-era Darjeeling toy-train charm.',
      image:
        'https://images.unsplash.com/photo-1626621542924-49202e6a4b27?auto=format&fit=crop&w=800&q=80',
      destination: 'Sikkim & Darjeeling',
      source: 'PREDEFINED'
    },
    {
      id: 'ne-mizoram-aizawl-blue',
      title: 'Mizoram Hills & Aizawl Escape',
      price: 34000,
      duration: '6 Days / 5 Nights',
      description:
        'Aizawl viewpoints, rolling Lushai hills, local markets, and slow travel through one of India’s greenest frontiers.',
      image:
        'https://images.unsplash.com/photo-1593693390920-a288b0f6c968?auto=format&fit=crop&w=800&q=80',
      destination: 'Mizoram',
      source: 'PREDEFINED'
    }
  ];
})();
