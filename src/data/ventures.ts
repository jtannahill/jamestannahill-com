/**
 * Single source for the Ventures & Platforms section and the /ventures/<slug>/
 * pages. Every venture gets a slug so its card is linkable as an anchor on the
 * homepage; the ones with a `page` block also get a page of their own.
 *
 * The rule for adding a `page`: it needs a thesis line and a few paragraphs
 * that say something the card cannot. A venture with nothing more to say stays
 * a card, because a thin page is worse than no page.
 */
export interface VenturePage {
  /** One line, in James's voice, on what the venture is for. */
  thesis: string;
  /** Mono record strip: what the venture is, not what James is to it. */
  record: string[];
  /** Body paragraphs. The first is set as the lead. */
  body: string[];
  /** Phrases inside `body` to turn into outbound links, matched literally. */
  links?: { text: string; url: string }[];
  /** Where the name comes from, set apart at the foot of the page. */
  namesake?: string;
  /** How the thing is actually built, for the readers who want that. */
  technical?: {
    /** Paragraphs, same voice as `body`, set after the argument. */
    body: string[];
    /** Mono spec rows, label and value. */
    spec: { label: string; value: string }[];
  };
  /** An iOS app to download, shown as icon plus App Store badge. */
  app?: {
    /** Square icon in /public, drawn at 72px with the App Store corner radius. */
    icon: string;
    /** What the app is, one line, beside the icon. */
    line: string;
    /** App Store product page. */
    url: string;
  };
  /** Title and description for the page's own metadata. */
  metaTitle: string;
  metaDescription: string;
}

export interface Venture {
  name: string;
  slug: string;
  description: string;
  url: string;
  logo: string;
  logoH: number;
  logoFill?: boolean;
  logoText?: string;
  url2?: string;
  url2Label?: string;
  page?: VenturePage;
}

export const ventures: Venture[] = [
  {
    name: 'Plocamium Holdings',
    slug: 'plocamium',
    description: 'Operator-led private equity platform deploying patient capital across industrial technologies and healthcare. Converts operational complexity into strategic leverage and compounding free cash flow. Third-generation family enterprise engineered for continuity, control, and multi-decade value creation.',
    url: 'https://plocamium.com',
    logo: '/logos/plocamium.png',
    logoH: 52,
    page: {
      thesis: 'Patient capital in the businesses that keep industry and care running.',
      record: ['Private equity', 'Industrial tech, healthcare', 'Third-generation family enterprise'],
      body: [
        'Plocamium is an operator-led private equity platform deploying patient capital across industrial technologies and healthcare. It converts operational complexity into strategic leverage and compounding free cash flow.',
        'The structure is a third-generation family enterprise, engineered for continuity, control, and multi-decade value creation. That inheritance sets the holding period. Capital that does not have to be returned on a fund clock can sit inside a business long enough to fix what is actually wrong with it, which is usually not the thing a diligence memo flags first.',
        'The work is post-transaction integration, organizational architecture, and operational transformation, carried out from inside the business rather than presented to it. The thesis is that operational complexity is not a discount to be priced in, it is the position itself: the companies worth owning are the ones whose difficulty keeps other buyers away.',
      ],
      namesake: 'Plocamium is a genus of red algae found in cold coastal waters worldwide. It grows in fine branching fronds that hold their structure in heavy water, and it is studied for the halogenated compounds it produces to defend itself.',
      metaTitle: 'Plocamium Holdings - James Tannahill',
      metaDescription: 'Operator-led private equity deploying patient capital across industrial technologies and healthcare. A third-generation family enterprise built for multi-decade value creation.',
    },
  },
  {
    name: 'PROSEC Defense Group',
    slug: 'prosec',
    description: 'U.S. military-level security services for institutions and corporations. Risk intelligence, protective operations, security technology, and crisis planning across Latin America and the Caribbean. Clarity before commitment. Readiness before crisis.',
    url: 'https://www.prosecpr.com',
    logo: '',
    logoH: 44,
    logoText: 'PROSEC',
    page: {
      thesis: 'Readiness engineered before the crisis, not assembled during it.',
      record: ['Security advisory', 'Veteran-led', 'Latin America, Caribbean'],
      body: [
        'PROSEC Defense Group provides U.S. military-level security services to institutions and corporations: risk intelligence, protective operations, security technology, and crisis planning across Latin America and the Caribbean.',
        'The firm is veteran-led, and the operating discipline comes directly from America\'s defense and national-security community. What that discipline actually buys a client is sequence. Clarity before commitment, readiness before crisis. Most security failures are not failures of capability, they are failures of having decided too late.',
        'Field operations is where a plan meets a place. The work is standing up protective posture on the ground, in countries where the assumptions that hold in New York do not, and keeping the people and interests inside that posture able to do their jobs.',
      ],
      metaTitle: 'PROSEC Defense Group - James Tannahill',
      metaDescription: 'Veteran-led security advisory delivering risk intelligence, protective operations, and crisis planning across Latin America and the Caribbean.',
    },
  },
  {
    name: 'RDLB',
    slug: 'rdlb',
    description: 'Strategic brand architecture for investors and operators. Engineers positioning, narrative systems, and go-to-market structure - converting trust into momentum and intention into capital movement.',
    url: 'https://www.rdlb.nyc/',
    url2: 'https://rdlbagentic.com/',
    url2Label: 'RDLB Agentic',
    logo: '/logos/rdlb.png',
    logoH: 36,
    page: {
      thesis: 'Positioning built as infrastructure, for firms whose product is trust.',
      record: ['Brand architecture', 'Investors and operators', 'Agentic systems'],
      body: [
        'RDLB engineers strategic brand architecture for investors and operators: positioning, narrative systems, and go-to-market structure that convert trust into momentum and intention into capital movement.',
        'Brand work aimed at capital audiences is a different discipline from brand work aimed at consumers. An LP or a counterparty is not persuaded by aesthetics, they are persuaded by coherence, by a firm whose stated thesis, published work, and actual behavior all describe the same institution. The output is closer to systems design than to campaigns.',
        'RDLB Agentic extends that into software, building the AI-native systems that carry positioning through to execution rather than leaving it in a deck.',
      ],
      links: [{ text: 'RDLB Agentic', url: 'https://rdlbagentic.com/' }],
      metaTitle: 'RDLB - James Tannahill',
      metaDescription: 'Strategic brand architecture for investors and operators: positioning, narrative systems, and go-to-market structure, extended into AI-native execution by RDLB Agentic.',
    },
  },
  {
    name: '1ness Strategies',
    slug: '1ness',
    description: 'Digital marketing and growth systems engineered on ethics, data, and design. Builds compliant advertising architecture that converts signal into measurable scale across regulated industries.',
    url: 'https://www.1nessagency.com/',
    logo: '/logos/1nessagency.png',
    logoH: 52,
    page: {
      thesis: 'Growth systems for industries where the rules are the hard part.',
      record: ['Growth systems', 'Regulated industries', 'Healthcare, finance'],
      body: [
        '1ness Strategies builds digital marketing and growth systems engineered on ethics, data, and design: compliant advertising architecture that converts signal into measurable scale across regulated industries.',
        'In healthcare and finance, the constraint is not creative and it is not budget, it is that most of what works elsewhere is not permitted. HIPAA, adverse-event reporting, and financial-promotion rules eliminate the standard playbook, which is why so much regulated-industry marketing is either toothless or quietly non-compliant.',
        'The alternative is to treat compliance as an architecture problem solved once, at the system level, rather than a review step applied to each campaign. Built that way, the constraint stops being a tax and starts being the moat, because competitors who cannot operate inside it simply do not show up.',
      ],
      metaTitle: '1ness Strategies - James Tannahill',
      metaDescription: 'Compliant growth systems for regulated industries. Advertising architecture engineered on ethics, data, and design for healthcare and finance.',
    },
  },
  {
    name: 'NewYorkLab',
    slug: 'newyorklab',
    description: 'Urban intelligence platform mapping the future state of cities through data. Deploys sensor networks, environmental analytics, and real-time monitoring systems - visual intelligence that helps decision-makers understand and reshape the urban fabric.',
    url: 'https://www.newyorklab.co/',
    logo: '/logos/newyorklab.png',
    logoH: 52,
    page: {
      thesis: 'Instrumenting the city so its decisions can be made on evidence.',
      record: ['Urban intelligence', 'Sensor networks', 'Environmental analytics'],
      body: [
        'NewYorkLab is an urban intelligence platform mapping the future state of cities through data. It deploys sensor networks, environmental analytics, and real-time monitoring systems, producing visual intelligence that helps decision-makers understand and reshape the urban fabric.',
        'Cities are the densest complex systems most people ever live inside, and they are governed largely on lagging indicators: last year\'s traffic study, last decade\'s census, a complaint line. The instruments exist to do better, they are simply not pointed at the block level where the decisions actually land.',
        'The platform\'s bet is that measurement changes argument. Once air quality, heat, noise, and movement are observable street by street and in real time, a debate that used to be about whose anecdote was more compelling becomes a debate about what to do.',
      ],
      metaTitle: 'NewYorkLab - James Tannahill',
      metaDescription: 'Urban intelligence platform mapping cities through sensor networks, environmental analytics, and real-time monitoring.',
    },
  },
  {
    name: 'Nargusta',
    slug: 'nargusta',
    description: 'A sailors\' hospitality network. Yacht club members extend reciprocal guest privileges to one another: club access, moorings, day sails, and local hosting, carried on a digital letter of introduction.',
    url: 'https://nargusta.com',
    logo: '/logos/nargusta.png',
    logoH: 40,
    page: {
      thesis: 'A letter of introduction, carried the way sailors have always carried one.',
      record: ['Hospitality network', 'Yacht clubs', 'Web and iPhone'],
      body: [
        'Nargusta is a sailors\' hospitality network. Yacht club members extend reciprocal guest privileges to one another, club access, moorings, day sails, and local hosting, carried on a digital letter of introduction.',
        'Reciprocity between clubs is an old institution that still runs on paper and on who happens to know whom. A member arriving in an unfamiliar port either has a letter from their secretary or spends the afternoon establishing that they are who they say they are. The custom is sound, the mechanism is what has aged.',
        'The network keeps the custom and replaces the mechanism. Membership is verified by phone against a club roster, every member decides for themselves what they offer and to whom, and the letter travels with the sailor rather than sitting in an office ashore. What is deliberately absent is a marketplace: nothing here is bought, because the thing being extended is not a service, it is standing.',
      ],
      namesake: 'Nargusta is a tropical hardwood of the American tropics, Terminalia amazonia, prized in boatbuilding for holding its shape in salt water and for taking fastenings without splitting.',
      app: {
        icon: '/nargusta-app-icon.png',
        line: 'Search hosts near any port, post a passage, and keep your letters with you at landfall.',
        url: 'https://apps.apple.com/us/app/nargusta/id6793273419',
      },
      metaTitle: 'Nargusta - James Tannahill',
      metaDescription: 'A sailors\' hospitality network. Yacht club members extend reciprocal guest privileges to one another on a digital letter of introduction. Web and iPhone.',
    },
  },
  {
    name: 'HMU API',
    slug: 'hmu-api',
    description: 'People, apps, and AI agents all need a way to reach you - HMU API gives them structured channels that self-organize, so you stop managing inbound and start making decisions. Don\'t email me. HMU. HitMyAPI.com',
    url: 'https://hmuapi.com',
    logo: '/logos/hmuapi.png',
    logoH: 70,
  },
  {
    name: 'MonkeyThorn Meet',
    slug: 'monkeythorn-meet',
    description: 'Video conferencing where privacy is architecture, not a checkbox. Zero AI processing, zero recordings, zero metadata - encryption keys never leave the browser. Trust as guarantee, not corporate promise.',
    url: 'https://meet.monkeythorn.com/meet',
    logo: '/logos/monkeythorn.png',
    logoH: 44,
  },
  {
    name: 'gOOOvy',
    slug: 'gooovy',
    description: 'Automated out-of-office engine for Google Voice built on schedule-aware intelligence. Converts missed texts into instant, contextual responses - stay present while staying reachable.',
    url: 'https://gooovy.com',
    logo: '/logos/gooovy.png',
    logoH: 36,
    page: {
      thesis: 'The out of office reply that text messaging never got.',
      record: ['Messaging automation', 'Google Voice', 'Schedule aware'],
      body: [
        'gOOOvy is an automated out-of-office engine for Google Voice, built on schedule-aware intelligence. It converts missed texts into instant, contextual responses, so you stay present while staying reachable.',
        'Email solved this in the 1990s and messaging never bothered. A text arriving during a flight, a surgery, a crossing, or a school pickup looks identical to a text arriving at a desk, and the silence that follows is read as indifference rather than as absence. The cost is not the missed message, it is the wrong conclusion the sender draws from it.',
        'The engine reads the calendar rather than a toggle, so the reply knows whether you are away for an hour or a week and answers accordingly, and it answers immediately. Presence, in practice, is not being available. It is having your absence be legible.',
      ],
      metaTitle: 'gOOOvy - James Tannahill',
      metaDescription: 'Automated out-of-office replies for Google Voice. Schedule-aware, contextual responses to missed texts, so absence is legible instead of silent.',
    },
  },
  {
    name: 'Art Generator',
    slug: 'art-generator',
    description: 'Daily generative art rendered from live atmospheric data. Weather patterns, satellite palettes, and environmental signals converted into original artworks - 17 artists, nine of them trained style models, daily rotation, PNG and print-quality output.',
    url: 'https://art.jamestannahill.com',
    logo: '',
    logoH: 44,
    logoText: 'Art.',
    page: {
      thesis: 'The weather, rendered daily, by a hand that is not the same hand twice.',
      record: ['Generative art', 'Atmospheric data', 'Trained style models'],
      body: [
        'Art. renders daily generative art from live atmospheric data. Weather patterns, satellite palettes, and environmental signals are converted into original artworks, on a rotation of seventeen artists, in PNG and print-quality output.',
        'Most generative art is prompted, which means its subject is ultimately the person writing the prompt. Here the subject is the sky over a specific place on a specific morning: pressure, humidity, wind, and precipitation are the input, and nobody chooses them. The work is figurative in an unusual sense, in that it is a picture of something that was actually there.',
        'The seventeen artists are the second half of the argument. Each one holds a fixed sensibility, its own palette, mark, and restraint, so the same weather resolves seventeen different ways and none of them is the house style. Rotation makes the point that a system with a single aesthetic is not an artist, it is a filter.',
      ],
      technical: {
        body: [
          'The input is measurement, not mood. Each morning the pipeline pulls hourly observations from Open-Meteo for the day\'s locations, temperature, relative humidity, surface pressure, wind speed and direction, and precipitation, and separately pulls Sentinel-2 scenes from the Copernicus Data Space over a set of thirty sites that rotate by season. The satellite pass is not used as an image. It is sampled for colour, so a palette comes off actual ground and actual cloud rather than off a designer\'s swatch.',
          'Each artist carries a profile rather than a prompt: how each weather dimension maps to that artist\'s visual language, what the work is emphatically not, and a palette constraint. Rothko takes temperature as the primary axis and pressure as the number of bands. Mondrian gets pressure as grid density and a hard prohibition on curves and diagonals. Kusama takes wind as dot density. The negative constraint does most of the work, because the common failure of a general model asked for a style is not that it misses the style, it is that it adds.',
          'Nine of the seventeen render through their own fine-tuned weights, FLUX.1-dev LoRAs trained on Replicate against curated sets of a single artist\'s canvases, from sixty-six down to fourteen where copyright limits what can be sourced. Fourteen was enough. The training sets are deliberately small and hand-picked, with early and figurative work excluded, because a style adapter learns a manner faster from a coherent handful than from everything an artist ever signed.',
          'The system grades itself. A vision model scores every finished piece against that artist\'s visual markers, and the fidelity score is stored alongside the work rather than thrown away. It is the scoring that drives the roadmap: the artist rendering worst was the one who then got trained weights, and the same score afterward confirmed the fix. What that instrumentation also showed is that weak style transfer is usually a prompt problem rather than a training problem, since a verbose prompt loaded with literal weather tokens dilutes the very adapter it is sitting on top of.',
        ],
        spec: [
          { label: 'Weather data', value: 'Open-Meteo hourly, six variables per location' },
          { label: 'Imagery', value: 'Sentinel-2 via Copernicus, 30 seasonal sites, sampled for palette' },
          { label: 'Renderer', value: 'FLUX 1.1 Pro, with per-artist FLUX.1-dev LoRAs' },
          { label: 'Trained models', value: '9 artist LoRAs, rank 16 to 32, 1,000 to 1,500 steps' },
          { label: 'Training sets', value: '14 to 66 curated canvases per artist' },
          { label: 'Evaluation', value: 'Vision model scores quality and artist fidelity, 1 to 10' },
          { label: 'Vector output', value: 'Claude on Bedrock renders an SVG in parallel' },
          { label: 'Orchestration', value: 'Step Functions on a 06:00 UTC schedule, Python Lambdas' },
          { label: 'Infrastructure', value: 'AWS via CDK: S3, DynamoDB, CloudFront, EventBridge' },
        ],
      },
      metaTitle: 'Art. - James Tannahill',
      metaDescription: 'Daily generative art rendered from live atmospheric data. Weather patterns and environmental signals converted into original works by eleven rotating artists.',
    },
  },
];

/** The ventures that have earned a page of their own. */
export const venturePages = ventures.filter((v) => v.page);
