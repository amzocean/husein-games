import { createTileSVG, createCenterHeartSVG } from './renderer.js';

const GUIDES = {
  'Auckland: A Chapter of You': {
    intro: 'New Zealand is a chapter of Fatema\'s story: her time studying in Auckland. Books sit beside original illustrations of the city and its harbour, with Husein and Fatema at the heart of the board. The city symbols do not claim particular excursions or a graduation.',
    background: 'Gentle harbour currents cross fern-green, glacier-aqua, and apricot tiles. The other textures draw on notebook rules, volcanic contours, ordinary fern veins, and sail stitching, not culturally significant Maori designs.',
    elements: {
      'auckland-kiwi': ['A little New Zealand kiwi', 'A rounded body, short legs, and long beak make the bird recognizable without a detailed wildlife portrait. It is a place symbol, not a claim that Fatema saw one.'],
      'auckland-sky-tower': ['Auckland on the skyline', 'The Sky Tower has a tall shaft and a compact observation deck. Its slender silhouette deliberately differs from Seattle\'s broad Space Needle.'],
      'auckland-study-books': ['Fatema\'s Auckland chapter', 'An open book above two stacked volumes represents the studying you told us about. The page marks are illustrative, not a university name or a qualification.'],
      'auckland-sailboat': ['The harbour city', 'Two open sails and a low hull evoke Auckland\'s waterfront. Two small window marks add a quiet paired detail, without inventing a boat trip.'],
      'auckland-fern-fronds': ['Fern edges', 'Two branching fronds curve along the outside of the tile. This is original botanical linework, not a borrowed cultural pattern.'],
      'auckland-study-pages': ['An open chapter', 'Curved page edges and a short central fold turn a study book into a frame, leaving room for the center illustration.'],
      'auckland-harbour-sails': ['Sails at the edges', 'Two tall triangular sails and a low curved hull give this frame a different structure from the book and fern.'],
      'auckland-pencil': ['Notes from that chapter', 'A diagonal pencil recalls the study theme, with a broad tip and a single readable highlight.'],
      'auckland-shell': ['A coastal detail', 'A fan-shaped shell connects the corners to New Zealand\'s coast, without claiming a particular beach visit.'],
      'auckland-bookmark': ['Keep your place', 'A notched bookmark carries the book vocabulary into the small corners.'],
      'auckland-fern-tip': ['A little fern', 'A short branching stem echoes the large botanical frame without repeating a complete frond.'],
    },
  },
  'Seattle: My Side of the Map': {
    intro: 'Seattle is Husein\'s side of the map. Rain, the skyline, and waterfront transport make a little portrait of the city, paired with Mumbai in the collection. These are place symbols, not claims about daily routines or trips.',
    background: 'Fine slanting rain sits on powder-blue, orchid-pink, and butter-yellow tiles. Ferry wakes, flight trails, pier planks, and cloud bands provide four other quiet Seattle textures.',
    elements: {
      'seattle-space-needle': ['Husein\'s skyline', 'A broad saucer-shaped deck and three splayed supports make the Space Needle different from Auckland\'s narrower Sky Tower.'],
      'seattle-ferry': ['Across the water', 'A stepped cabin, tall funnel, and wide hull suggest a Seattle-area ferry. This is an original vessel, not a specific operator or a claimed journey.'],
      'seattle-umbrella': ['A little shelter', 'A wide scalloped canopy and hooked handle bring a rounded rain-day object into the city theme.'],
      'seattle-seaplane': ['Waterfront wings', 'An angled plane on long floats represents the seaplanes associated with the Seattle waterfront, without asserting a flight you took.'],
      'seattle-needle-supports': ['The skyline as a frame', 'A shallow observation-deck outline rests over two widely splayed supports, leaving the center open.'],
      'seattle-pier-railings': ['By the waterfront', 'Straight posts, short cross rails, and a low deck evoke a pier rather than a closed picture frame.'],
      'seattle-umbrella-canopy': ['Under the rain canopy', 'A curved, scalloped top contrasts with the angular skyline and railings.'],
      'seattle-raindrop': ['Seattle weather', 'One broad teardrop and a small highlight keep the rain motif clear at phone size.'],
      'seattle-boarding-pass': ['A waterfront ticket', 'An original ticket with a short divider suggests transport; it is not a real boarding pass or barcode.'],
      'seattle-pine': ['Pacific Northwest green', 'A chunky evergreen silhouette adds a regional natural detail without tiny needles.'],
      'seattle-mooring-cleat': ['Tied to the pier', 'A wide cleat on a short base brings a different, solid waterfront silhouette to the corners.'],
    },
  },
  'Mumbai: Your Side of the Map': {
    intro: 'Mumbai is Fatema\'s side of the map, a companion to Husein\'s Seattle board. Architecture, transport, sea air, and vada pav represent the city without assuming a particular commute or outing.',
    background: 'Sea-breeze curves pass through mango, sea-glass mint, and rose tiles. Rail routes, paving joints, folded snack paper, and monsoon streaks keep Mumbai\'s texture vocabulary distinct.',
    elements: {
      'mumbai-gateway': ['The Gateway of India', 'A broad central opening, stepped roof, and side turrets suggest the landmark through an original simplified silhouette.'],
      'mumbai-local-train': ['The city in motion', 'A front-facing local train has two large windows and short rails underneath. It is a Mumbai symbol, not a claim about Fatema\'s commute.'],
      'mumbai-rickshaw': ['A little city ride', 'An asymmetric cabin, sloping roof, and two broad wheels make the auto-rickshaw different from the upright train.'],
      'mumbai-vada-pav': ['A Mumbai vada pav', 'A rounded pav bun surrounds a craggy potato vada, with a curved chilli beside it. Broad separated layers keep the snack readable at tile size.'],
      'mumbai-gateway-arch': ['An architectural welcome', 'A raised arch and stepped outside supports echo the Gateway without duplicating its full center illustration.'],
      'mumbai-train-handles': ['Hold on, we are moving', 'Two hanging triangular handles and a top rail borrow their shape from public transport.'],
      'mumbai-seafront-parapet': ['A little sea air', 'Capped side posts and a low balustrade evoke a promenade, rather than claiming a particular walk together.'],
      'mumbai-train-ticket': ['A city ticket', 'A tall paper ticket with decorative rules supports the local-train motif; it has no real route, price, or code.'],
      'mumbai-snack-plate': ['A little snack plate', 'A small split bun sits above a broad plate, echoing the vada pav center without any tea glass.'],
      'mumbai-direction-arrow': ['This way through the city', 'A chunky street-direction arrow introduces a clear angular corner silhouette.'],
      'mumbai-seagull': ['Above the waterfront', 'Two open wing curves suggest a coastal bird without a detailed animal drawing.'],
    },
  },
  'UK: Remember Us Here?': {
    intro: 'A keepsake of your recent UK trip together: the bus tour, Harrods, London Bridge, the clock tower and Big Ben, and the Ferris wheel you mentioned. Original London-inspired illustrations carry those references without inventing an itinerary.',
    background: 'Thames-like flowing lines cross cherry-peach, pale-denim, and butter-yellow tiles. Bus routes, stone courses, clock ticks, and shop-awning stripes round out the London vocabulary.',
    elements: {
      'london-tour-bus': ['Our bus-tour chapter', 'Two rows of windows and a broad double-decker body recall the bus tour you mentioned. It is an original bus, with no operator logo or copied livery.'],
      'london-big-ben': ['The familiar clock tower', 'A pointed roof and square clock face represent Elizabeth Tower, commonly called Big Ben after its bell. The guide groups your clock-tower and Big Ben references rather than treating them as two different landmarks.'],
      'london-harrods': ['The Harrods stop', 'A tiered shop facade and repeated windows nod to Harrods. It is a simplified architectural reference, with no copied wordmark or assumption about purchases.'],
      'london-london-bridge': ['London Bridge', 'A low road deck and sturdy piers represent London Bridge, not Tower Bridge: there are deliberately no twin Gothic towers or lifting roadway.'],
      'london-eye-arc': ['The Ferris-wheel view', 'An open upper wheel arc, radial marks, and lower supports nod to the London Eye. Its airy frame avoids repeating the previous fairground wheel center.'],
      'london-bridge-spans': ['Along the bridge', 'A straight deck and short open spans turn the bridge reference into an outside frame.'],
      'london-shopfront': ['A London shopfront', 'A pitched awning, narrow side windows, and open lower edge provide an architectural shopping reference.'],
      'london-tour-ticket': ['A little tour keepsake', 'A notched paper ticket recalls the bus-tour reference without reproducing a real ticket.'],
      'london-shopping-bag': ['The shopping stop', 'An unbranded bag connects to Harrods as a place reference, not proof that you bought anything there.'],
      'london-eye-capsule': ['A tiny wheel capsule', 'A rounded observation capsule brings the Ferris-wheel reference into the corners.'],
      'london-clock-hands': ['A moment remembered', 'Open hands and a few ticks carry the clock-tower vocabulary without adding another full clock face.'],
    },
  },
  'Egypt: You, Me & Ancient Wonders': {
    intro: 'A remembrance of your Egypt trip a couple of years ago: pyramids, museums, a river-boat tour, Imam Husain\'s zari mubarak, and Al Jami al-Anwar in Misr. Sacred references use restrained, original architectural details; there are no human depictions, invented inscriptions, or claims about religious rituals.',
    background: 'Quiet Nile-current lines cross sand-gold, aqua, and sunset-rose tiles. Sand ridges, limestone joints, courtyard paving, and museum linen keep the atmosphere warm and grounded.',
    elements: {
      'egypt-pyramids': ['The pyramids', 'Three differently sized triangular masses recall your pyramid reference. Simple edge and stone marks keep the ancient silhouettes readable.'],
      'egypt-museum': ['The museum chapter', 'A pediment and four columns are an original museum symbol for the museums you visited, not an assertion about a particular building or collection.'],
      'egypt-river-boat': ['Our river-boat tour', 'A broad hull and shaded passenger deck recall the river-boat tour you mentioned. It is a tour boat rather than an invented felucca sailing trip.'],
      'egypt-al-jami-anwar': ['Al Jami al-Anwar, Misr', 'The domed courtyard fountain from your reference photos stands on a low stepped base, with arched openings and the surrounding pointed arcade behind it. Original simplified linework recalls the stone pavilion without copying inscriptions or claiming an exact building plan.'],
      'egypt-zarih-lattice': ['Imam Husain\'s zari mubarak', 'Restrained side latticework and a raised upper rail respectfully recall the sacred enclosure you mentioned. The illustration does not depict Imam Husain, a tomb interior, or sacred writing.'],
      'egypt-anwar-arcade': ['The mosque arcade', 'Open pointed arches and short side supports extend the Al Jami al-Anwar reference through original architectural linework.'],
      'egypt-museum-colonnade': ['A museum colonnade', 'A triangular pediment, slim columns, and a broad base turn the museum vocabulary into a distinct frame.'],
      'egypt-papyrus': ['A Nile-side plant', 'A broad fan over a straight stem is an original papyrus-inspired plant detail, not a copied historical symbol.'],
      'egypt-museum-label': ['Beside an exhibit', 'A small museum label has decorative lines only, with no invented artifact description or hieroglyphs.'],
      'egypt-boat-pennant': ['On the river boat', 'An unmarked pennant and short pole repeat the boat-tour vocabulary, without national or religious insignia.'],
      'egypt-arch-niche': ['An architectural detail', 'A small pointed opening echoes the mosque arcade, with no sacred inscription or figurative decoration.'],
    },
  },
  'Now Showing: Husein & Fatema': {
    intro: 'Tonight\'s leading pair: Husein and Fatema. A little movie-date invitation with two reserved seats and a film we will probably spend half the time talking over. Original illustrations, not a real film or a claim about a shared outing.',
    background: 'Faint projector rays cross cherry-blush, butter-yellow, and sky-blue tiles. The light stays behind the matchable artwork, like a quiet beam across a cinema.',
    elements: {
      'cinemadate-popcorn': ['The essential popcorn', 'A puffy, overflowing striped tub makes the snack recognizable from its outline. Sharing is encouraged; counting who ate more is not.'],
      'cinemadate-clapperboard': ['Our opening scene', 'The lifted, tilted clapstick makes a diagonal silhouette, ready to announce the beginning of a little movie date.'],
      'cinemadate-seat-pair': ['Reserved for Husein and Fatema', 'Two rounded cinema seats carry H and F marks: a seat for each of the stars of this imagined movie date.'],
      'cinemadate-film-reel': ['Just one more scene', 'A round reel with four open holes and a curling film tail contrasts with the tall popcorn and angular clapperboard.'],
      'cinemadate-ticket-edge': ['Admit two', 'Scooped sides and short perforation marks turn a cinema ticket into the outside frame.'],
      'cinemadate-filmstrip': ['Along the filmstrip', 'Two perforated vertical strips leave the top and bottom open, instead of drawing another closed ticket.'],
      'cinemadate-screen-curtains': ['The curtains open', 'Draped sides and a soft upper swag frame an imaginary cinema screen.'],
      'cinemadate-glasses': ['A little extra dimension', 'Two connected square lenses are a miniature pair of cinema glasses, not a second frame to match.'],
      'cinemadate-kernel': ['One more handful', 'A little popped kernel repeats the puffy popcorn silhouette in the corners.'],
      'cinemadate-ticket-stub': ['Keep the little stub', 'A tilted, notched ticket is a tiny souvenir from this imagined date.'],
      'cinemadate-projector': ['Roll the film', 'Two small reels above a box and lens reduce an old-fashioned projector to a readable corner motif.'],
    },
  },
  'Dinner\'s on Husein': {
    intro: 'A table reserved for Husein and Fatema, with nowhere to rush and dessert absolutely not optional. This playful little bistro is an invitation to a future dinner date.',
    background: 'Quiet crossed linen threads suggest a restaurant tablecloth. Peach, warm cream, and pistachio make the board feel like a bright little bistro rather than formal fine dining.',
    elements: {
      'bistrodate-spaghetti-fork': ['A very twirly bite', 'Curled noodles wrap around a tilted fork. The open linework keeps it different from the solid serving dish.'],
      'bistrodate-cloche': ['A little H/F dinner service', 'A broad domed serving cover is engraved with H and F for Husein and Fatema. Its low, wide outline stays recognizable even before you notice the initials.'],
      'bistrodate-bottle-candle': ['A little table light', 'A tall candle in a reused bottle adds a cosy restaurant detail. The flame is decorative, not a separate match.'],
      'bistrodate-sundae': ['We saved room', 'Rounded scoops sit above a wide dessert glass and a narrow foot: the very important last course.'],
      'bistrodate-scalloped-plate': ['The pretty plate', 'A softly scalloped plate rim runs around the tile, with a different outline from the canopy and cutlery.'],
      'bistrodate-awning': ['Our corner bistro', 'A striped top and scalloped valance suggest a small restaurant awning, with airy open sides below.'],
      'bistrodate-place-setting': ['Ready for two', 'An oversized fork and curved knife become the two sides of an open place-setting frame.'],
      'bistrodate-fork': ['A tiny fork', 'Three clear tines and a long handle carry the dinner vocabulary into the corners.'],
      'bistrodate-napkin': ['The folded napkin', 'A triangular fold adds a compact silhouette, separate from the tall menu card.'],
      'bistrodate-menu': ['What looks good?', 'A little tilted menu has decorative marks, not real dishes, prices, or words to solve.'],
      'bistrodate-spoon': ['For the last bite', 'A round-bowled spoon is the small companion to the dessert sundae.'],
    },
  },
  'Swings Before Sunset': {
    intro: 'Husein and Fatema, reporting for a very serious competition over who swings higher. A playful park-date invitation, full of movement and a little duck with somewhere to be.',
    background: 'A faint double path winds through leaf-green, sunny-peach, and clear-blue tiles. It suggests a walk through the park without adding flowers or extra matchable-looking objects.',
    elements: {
      'parkdate-swing': ['Save me a swing', 'Long, open ropes and a curved seat leave plenty of air in the center, just like a swing waiting for its next push.'],
      'parkdate-slide': ['Your turn first', 'An upright ladder meets a broad curling slide. The asymmetric outline makes this different from the hanging swing.'],
      'parkdate-seesaw': ['Team Husein and Fatema', 'A tilted plank balances over an H/F-marked triangular support. Two handles and a little give and take make room for both teammates.'],
      'parkdate-duck': ['The local celebrity', 'A rounded duck, pointed beak, and upturned tail add a cheerful character among the playground equipment.'],
      'parkdate-swing-set': ['The big swing frame', 'Sloping supports and a high crossbar borrow the shape of playground equipment, not another rectangular border.'],
      'parkdate-winding-rails': ['Take the scenic route', 'Two curving rails wander down the sides, leaving the center open for the main illustration.'],
      'parkdate-picket-gate': ['Into the park', 'Pointed gate posts and a low connecting rail suggest the entrance to a little neighbourhood park.'],
      'parkdate-footprints': ['A little walk', 'Two offset shoe prints leave a tiny trail in each corner.'],
      'parkdate-acorn': ['A pocket-sized find', 'A round nut, broad cap, and short stem make a tiny acorn from a park walk.'],
      'parkdate-kite-tail': ['Catch the breeze', 'A curving string and two short ties suggest a kite tail without filling the tile with another large object.'],
      'parkdate-leaf': ['One little leaf', 'A broad leaf and a single pale vein keep this natural detail simple enough to see at game size.'],
    },
  },
  'Meet Me at the Ferris Wheel': {
    intro: 'Husein and Fatema, one more ride, and a completely unnecessary amount of candy. A bright little fairground-date invitation, with original rounded rides rather than a particular real amusement park.',
    background: 'Faint canopy rays spread across raspberry-pink, aqua, and pale-gold tiles. The lively colour story stays soft enough for the deeper match colours to stand out.',
    elements: {
      'fairdate-ferris-wheel': ['The view from up there', 'A spoked wheel, four little gondolas, and splayed supports make an airy, round silhouette.'],
      'fairdate-carousel-horse': ['Pick your favourite horse', 'An original toy-like horse rides a slim pole. Its mane, tail, and bent legs carry the movement without tiny decorative tack.'],
      'fairdate-bumper-car': ['The H+F joyride', 'Husein and Fatema get their own H+F-marked bumper car. Its broad rubber base and tall contact pole keep the outline different from the open Ferris wheel.'],
      'fairdate-cotton-candy': ['Cloud on a stick', 'A big, irregular puff sits on a tapered paper cone. The rounded candy adds a soft silhouette among the mechanical rides.'],
      'fairdate-striped-canopy': ['Under the big canopy', 'A peaked, striped roof and scalloped valance turn a fairground booth into an airy frame.'],
      'fairdate-coaster-track': ['One more ride', 'Two rails curve over an uneven crest and down the sides, with short cross ties keeping the track readable.'],
      'fairdate-ferris-supports': ['Feet on the ground', 'Broad sloping supports and short crossbars borrow the structure beneath a Ferris wheel, not its circular center.'],
      'fairdate-wristband': ['All-day admission', 'A tilted fastening band is the little paper bracelet that says there is time for another ride.'],
      'fairdate-pennant': ['Follow the flags', 'A triangular flag on a short pole brings a little fairground bustle to the corners.'],
      'fairdate-admit-ticket': ['Two for the next ride', 'A compact, serrated ticket has decorative admission marks, not real text or a scannable code.'],
      'fairdate-carousel-pole': ['Around we go', 'A striped vertical pole is a small companion to the carousel horse.'],
    },
  },
  'A Little Paint, A Lot of Us': {
    intro: 'A little mess, a lot of Husein and Fatema. This painting-date invitation puts H, a heart, and F on the canvas: something made with affection matters more than a perfect result.',
    background: 'Loose parallel brush sweeps sit behind periwinkle, apricot, and lemon tiles. The texture stays quiet: the paint blobs in the corners are matches, but these background strokes are not.',
    elements: {
      'paintdate-palette': ['Pick a happy colour', 'An asymmetric painter\'s palette has a real open thumb hole and pale paint wells, so its curved outline reads without tiny details.'],
      'paintdate-easel': ['Husein and Fatema, on canvas', 'A canvas rests on a wide ledge and three splayed legs. H and F surround a small painted heart: an original little couple\'s artwork, not another puzzle to solve.'],
      'paintdate-swoosh-brush': ['Make a little mess', 'A broad diagonal brush leaves one sweeping stroke underneath. Its long, open silhouette contrasts with the solid tube and rounded palette.'],
      'paintdate-paint-tube': ['Squeeze in some colour', 'A tilted paint tube has a crimped top, a broad label, and a small cap. The label is a decorative panel, not a brand.'],
      'paintdate-brushstroke': ['Perfectly imperfect', 'Broken, uneven brush marks suggest a hand-painted border rather than a mechanically regular rectangle.'],
      'paintdate-canvas-stretchers': ['A slightly wonky canvas', 'A tilted canvas outline and visible stretcher edges make the frame feel like something propped in a studio.'],
      'paintdate-taped-paper': ['Keep it in place', 'Four diagonal strips hold an open paper edge. The tape corners have their own distinct angular outline.'],
      'paintdate-paint-blob': ['Happy little accident', 'An irregular paint splat is intentionally chunky enough to recognize without delicate droplets.'],
      'paintdate-tape-tab': ['A torn bit of tape', 'A tilted strip with torn ends repeats the taped-paper vocabulary at corner size.'],
      'paintdate-pencil': ['Sketch it first', 'A broad pencil and pointed tip make a simple diagonal corner detail.'],
      'paintdate-bristle-fan': ['One last brushstroke', 'A wide fan of bristles and a short handle echo the painting tools without repeating the full center brush.'],
    },
  },
  'Kabhi Main Kabhi Tum': {
    intro: 'Mustafa and Sharjeena, told through everyday things: a motorcycle ride, a game in progress, and a book left open. Two different worlds finding their way together.',
    background: 'Soft road curves nod to the motorcycle rides. Denim blue, apricot, and butter yellow keep the board warm and playful.',
    elements: {
      'kmkt-motorcycle': ['Mustafa\'s motorcycle', 'The bike rides you remember, reduced to two wheels, a seat, and that instantly familiar silhouette.'],
      'kmkt-controller': ['Mustafa\'s gaming world', 'A rounded controller represents his love of games. The large buttons keep it readable even on a little tile.'],
      'kmkt-sharjeena-books': ['Sharjeena\'s books', 'An open book above a small stack represents her bookish, studious side: the other half of their opposites-attract story.'],
      'kmkt-gaming-desk': ['The gaming setup', 'A monitor and desk carry the gaming reference beyond the controller, with a wider, more structured silhouette.'],
      'kmkt-game-bezel': ['Game-screen frame', 'The outline borrows the shape of a monitor, including its little stand.'],
      'kmkt-open-book': ['Open-book frame', 'Curved page edges and a central fold turn Sharjeena\'s books into a border.'],
      'kmkt-road-bends': ['Road-bend frame', 'Open, sweeping sides echo a winding ride rather than another rectangular frame.'],
      'kmkt-bike-key': ['Motorcycle key', 'A small key carries the bike reference into the corners.'],
      'kmkt-wheel': ['Spoked wheel', 'A tiny wheel repeats the motorcycle vocabulary without becoming another full bike.'],
      'kmkt-game-buttons': ['Game buttons', 'A familiar directional pad is the smallest version of Mustafa\'s gaming world.'],
      'kmkt-bookmark': ['Bookmark', 'The notched strip belongs to Sharjeena\'s reading world.'],
    },
  },
  'Meri Zindagi Hai Tu': {
    intro: 'Ayra\'s medical world meets Kamyar\'s car-and-keys world. The artwork uses those character references, with original supporting details rather than recreating dramatic scenes.',
    background: 'A quiet fabric weave suggests a doctor\'s coat. Aqua, pink, and lavender make the setting feel affectionate rather than clinical.',
    elements: {
      'mzht-stethoscope': ['Ayra\'s stethoscope', 'Ayra is a doctor. The curved tubing and round chestpiece make that character reference recognizable without a portrait.'],
      'mzht-car-keys': ['The car keys', 'A nod to the early car-key scene involving Ayra and Kamyar. An oversized key ring and fob make the object easy to recognize.'],
      'mzht-kamyar-car': ['Kamyar\'s car', 'The car connects to that same early storyline. This is an original, simplified car illustration, not a recreation of a particular model.'],
      'mzht-ayra-coat': ['Ayra\'s doctor\'s coat', 'An original supporting symbol of her profession, with broad lapels and two clear pockets.'],
      'mzht-stethoscope-loop': ['Stethoscope frame', 'The medical tubing becomes an open border, ending in a little round chestpiece.'],
      'mzht-car-window': ['Car-window frame', 'The sloping upper edge borrows its shape from a car window.'],
      'mzht-chart-clip': ['Medical-chart frame', 'The small clip at the top suggests a clipboard from Ayra\'s working world.'],
      'mzht-key-fob': ['Key fob', 'A compact companion to the car-key center illustration.'],
      'mzht-pulse': ['Heartbeat line', 'A medical-inspired supporting detail that also gives the theme a gentle romantic note.'],
      'mzht-coat-button': ['Coat button', 'The stitched button is a small clothing detail from the doctor\'s-coat vocabulary.'],
      'mzht-medical-cross': ['Medical cross', 'A simple profession-inspired symbol, not a specific scene or hospital logo.'],
    },
  },
  'Tere Bin': {
    intro: 'Meerab and Murtasim through a few familiar objects: his shawl, her contract, the pool, and the haveli. Flowing cloth, curved paper, open water, and architecture give each one a different outline.',
    background: 'A faint woven texture echoes the shawl. Celadon, warm ivory, and dusty rose soften the more dramatic references.',
    elements: {
      'terebin-murtasim-shawl': ['Murtasim\'s shawl', 'The recognizable shawl becomes flowing fabric with two fringed ends, rather than a square of cloth.'],
      'terebin-meerab-contract': ['Meerab\'s contract', 'The contract is represented by curled paper and a diagonal pen. The marks are decorative, not a quotation from the show.'],
      'terebin-swimming-pool': ['The pool scene', 'A ladder and open ripples stand in for the memorable pool setting, without turning the whole tile into another box.'],
      'terebin-haveli-door': ['The haveli doorway', 'An architectural reference to the show\'s setting, drawn as an original carved arch rather than an exact set replica.'],
      'terebin-draped-shawl': ['Shawl-drape frame', 'Curved fabric edges and a little fringe carry the shawl around the outside of the tile.'],
      'terebin-pool-edge': ['Poolside frame', 'Open rails, a tiny ladder, and a lower ripple borrow their vocabulary from the pool.'],
      'terebin-carved-arch': ['Carved-arch frame', 'A raised central arch and side pillars echo the haveli doorway.'],
      'terebin-tassel': ['Shawl tassel', 'A small fringe detail from the shawl.'],
      'terebin-pen-nib': ['Pen nib', 'The writing reference from Meerab\'s contract, simplified to a pointed nib.'],
      'terebin-pool-ripple': ['Pool ripples', 'Two little waves repeat the pool reference in the corners.'],
      'terebin-carving': ['Doorway carving', 'A miniature arch carries the architectural detail into the corners.'],
    },
  },
  'Dar-e-Nijaat': {
    intro: 'A quiet, spoiler-light interpretation inspired by the early episodes. Everyday communication and gentle gestures set the mood; the supporting objects are original illustrations, not clues to later plot events.',
    background: 'Fine linen strands suggest ordinary fabric. Sage, lilac, and warm sand keep the theme calm while giving the tiles distinct tones.',
    elements: {
      'den-everyday-phone': ['Everyday conversations', 'An ordinary phone and message bubble represent communication. This is a general motif, not a specific gift or plot event.'],
      'den-flowing-chadar': ['A flowing chadar', 'A plain, flowing textile inspired by the clothing vocabulary, with no wedding styling or specific scene attached.'],
      'den-reading-lamp': ['A little quiet light', 'An original supporting illustration for the reflective mood. It is not presented as an iconic prop from the drama.'],
      'den-kind-hands': ['A gesture of kindness', 'Cupped hands and a small heart represent care and compassion. This is symbolic artwork, not a reconstruction of a scene.'],
      'den-chadar-drape': ['Cloth-drape frame', 'The gently falling edges turn the chadar vocabulary into a border.'],
      'den-phone-surround': ['Phone-outline frame', 'A rounded handset outline, with a speaker and home bar, surrounds the tile.'],
      'den-woven-cloth-edge': ['Soft textile frame', 'Open curved corners and small folds keep this border lighter than a solid enclosure.'],
      'den-message-bubble': ['Message bubble', 'A small supporting symbol of everyday communication.'],
      'den-cloth-fringe': ['Cloth fringe', 'Three soft threads repeat the chadar reference.'],
      'den-lamp-glow': ['A little glow', 'A light-inspired accent accompanies the original lamp illustration.'],
      'den-cuff': ['Clothing cuff', 'A small, neutral textile detail, not a reference to a later outfit.'],
    },
  },
  'Our Little Game Dates': {
    intro: 'Different places, a little connection through games. Wordle, Strands, Connections, and Pips inspire the centers; Photo Tiles, Hidaayat Ciphers, Ludo, and Better Half bring your own game room into the smaller details.',
    background: 'Wandering word trails suggest little paths between separate places. Blush, periwinkle, and pale green keep the puzzles playful and affectionate. These are original game-inspired drawings, not copied interfaces or logos.',
    elements: {
      'gamedates-five-letter-guess': ['A five-letter heart', 'Two little rows of letter tiles nod to Wordle. HEART is an affectionate illustration choice, not a daily answer or a puzzle to solve on this board.'],
      'gamedates-winding-word': ['A word that finds its way', 'The letters of HEART follow a winding path, inspired by tracing words in Strands. Its open, curving silhouette contrasts with the straight letter rows.'],
      'gamedates-connected-groups': ['Things that belong together', 'Four little clusters each hold four marks: a nod to finding groups in Connections, and to the pleasure of discovering what fits.'],
      'gamedates-domino-pair': ['A little pair of pips', 'Two offset dominoes refer to Pips. Their divided faces and dot patterns give the theme a tall, tilted silhouette without copying a puzzle layout.'],
      'gamedates-photo-corners': ['Photo Tiles frame', 'Four folded photo corners bring the theme back to the pictures and matching tiles here on huseinlovesyou.com.'],
      'gamedates-halfway-letters': ['Better Half frame', 'Five small letter spaces along the top and bottom refer to Better Half, the game room\'s daily word puzzle that meets you halfway.'],
      'gamedates-distance-link': ['A connection across the gap', 'Two separate sides of the frame reach toward a little heart. The gap stays visible: connection does not have to mean being in the same room.'],
      'gamedates-photo-pair': ['A tiny tile match', 'Two overlapping photo tiles echo the matching game you are playing now.'],
      'gamedates-halfway-heart': ['The halfway heart', 'A divided heart is a small companion to the Better Half frame, and an affectionate nod to the game room.'],
      'gamedates-ludo-pawn': ['A Ludo turn', 'A round-headed pawn refers to the game room\'s Ludo, which can be played from different places.'],
      'gamedates-cipher-letters': ['A little cipher', 'Two different letterforms nod to Hidaayat Ciphers: turning a substituted letter back into its real one. These marks are decorative, not a quotation or a puzzle clue.'],
    },
  },
};

const GROUPS = [
  { title: 'The center illustrations', key: 'shapeNames', type: 'shape', property: 'shape' },
  { title: 'The frames', key: 'ringStyles', type: 'ring', property: 'style' },
  { title: 'The corner details', key: 'accentShapes', type: 'accent', property: 'accentShape' },
];

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function motifName(identifier) {
  return identifier.replace(/^[^-]+-/, '').replace(/-/g, ' ')
    .replace(/^./, letter => letter.toUpperCase());
}

function guideItem(preview, name, description) {
  const item = document.createElement('li');
  item.className = 'theme-guide-item';
  preview.setAttribute('aria-hidden', 'true');
  preview.setAttribute('focusable', 'false');
  preview.classList.add('theme-guide-preview');
  const copy = document.createElement('div');
  copy.append(textElement('h4', name), textElement('p', description));
  item.append(preview, copy);
  return item;
}

function renderThemeGuide(board, container) {
  const theme = board.theme;
  const guide = GUIDES[theme.name];
  const content = document.createDocumentFragment();
  content.append(textElement('p', 'Behind the tiles', 'theme-guide-eyebrow'));
  const title = textElement('h2', `${theme.emoji} ${theme.name}`);
  title.id = 'theme-guide-title';
  content.append(title);
  content.append(textElement('p', guide?.intro || 'Explore the artwork in this theme. Every preview below uses the same SVG drawing as the game.', 'theme-guide-intro'));
  content.append(textElement('p', 'Match the same design in the same color. The background and the center H/F heart are decoration, not matches.', 'theme-guide-rule'));

  const attributes = [...new Map(board.tiles.flatMap(tile => [...tile.attributes])).values()];
  for (const group of GROUPS) {
    const section = document.createElement('section');
    section.className = 'theme-guide-group';
    section.append(textElement('h3', group.title));
    const colors = document.createElement('p');
    colors.className = 'theme-guide-colors';
    colors.append(document.createTextNode('Match colors '));
    for (const color of theme.palette[group.type]) {
      const swatch = document.createElement('span');
      swatch.className = 'theme-guide-swatch';
      swatch.style.backgroundColor = color;
      swatch.setAttribute('role', 'img');
      swatch.setAttribute('aria-label', color);
      swatch.title = color;
      colors.append(swatch);
    }
    section.append(colors);
    const list = document.createElement('ul');
    for (const [index, identifier] of theme[group.key].entries()) {
      const color = theme.palette[group.type][index % theme.palette[group.type].length];
      const attr = attributes.find(attr => attr.type === group.type && attr[group.property] === identifier && attr.color === color);
      if (!attr) continue;
      const preview = createTileSVG({
        index: -1,
        bgColor: theme.palette.bg[index % theme.palette.bg.length],
        attributes: new Map([[attr.id, attr]]),
      }, theme);
      const [name, description] = guide?.elements[identifier] || [
        motifName(identifier),
        `A ${motifName(identifier).toLowerCase()} motif from ${theme.name}, shown in one of its match colors.`,
      ];
      list.append(guideItem(preview, name, description));
    }
    section.append(list);
    content.append(section);
  }

  const canvas = document.createElement('section');
  canvas.className = 'theme-guide-group';
  canvas.append(textElement('h3', 'The finishing touches'));
  const finishing = document.createElement('ul');
  const background = createTileSVG({ index: -1, bgColor: theme.palette.bg[0], attributes: new Map() }, theme);
  finishing.append(guideItem(background, 'The background', guide?.background || 'A quiet decorative canvas behind the matchable elements. Background colors and textures are not used for matching.'));
  finishing.append(guideItem(createCenterHeartSVG(theme),
    theme.showThemeName ? 'This theme, at the heart of it' : theme.showCoupleNames ? 'Husein and Fatema, at the heart of it' : 'The H/F heart',
    theme.showThemeName
      ? 'The theme title frames the little H/F heart in the middle of the board. The title and monogram are decorative, not playable matches.'
      : theme.showCoupleNames
      ? 'Husein and Fatema frame the little H/F heart in the middle of the board. The names and monogram are a decorative keepsake, not playable matches.'
      : 'The little H/F monogram is the board\'s keepsake. It stays in the middle and is not a playable tile.'));
  canvas.append(finishing);
  content.append(canvas);
  const back = textElement('a', 'Back to the board', 'theme-guide-back');
  back.href = '#app';
  content.append(back);
  container.replaceChildren(content);
  container.hidden = false;
}

export { renderThemeGuide };
