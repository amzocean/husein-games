import { createTileSVG, createCenterHeartSVG } from './renderer.js';

const GUIDES = {
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
  finishing.append(guideItem(createCenterHeartSVG(theme), 'The H/F heart', 'The little H/F monogram is the board\'s keepsake. It stays in the middle and is not a playable tile.'));
  canvas.append(finishing);
  content.append(canvas);
  const back = textElement('a', 'Back to the board', 'theme-guide-back');
  back.href = '#app';
  content.append(back);
  container.replaceChildren(content);
  container.hidden = false;
}

export { renderThemeGuide };
