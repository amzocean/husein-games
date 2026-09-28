// One hundred new UTC daily sets beginning September 28, 2026.
// Each tuple is [answer, definition, sentence]. Clues are stored separately
// so the prose remains easy to review and the validator can verify the fully
// resolved puzzle objects.

export const NEW_PUZZLE_CONTENT = [
  // Day 1
  ['ADORE', 'To love and admire someone deeply.', 'I adore the gentle way Fatema makes every place feel like home.'],
  ['BLOOM', 'To open into a flower or grow beautifully.', 'My happiest thoughts bloom whenever Fatema smiles at me.'],
  ['COMFY', 'Comfortable and pleasantly relaxed.', 'A comfy evening beside you is all the adventure I need.'],
  // Day 2
  ['ANGEL', 'A kind or exceptionally good person.', 'Fatema is the angel who brings patience and warmth to my busiest days.'],
  ['BLISS', 'Perfect happiness or deep joy.', 'Quiet tea with you is my favorite kind of bliss.'],
  ['DREAM', 'A cherished hope or a series of thoughts during sleep.', 'Building a gentle life with Fatema is my sweetest dream.'],
  // Day 3
  ['AMITY', 'Friendly and peaceful relations.', 'Our amity turns even a small disagreement into a chance to understand each other.'],
  ['BRIDE', 'A woman on or near her wedding day.', 'My beautiful bride still makes my heart skip when she enters the room.'],
  ['CHEER', 'Gladness, encouragement, or a happy mood.', 'Fatema brings cheer to ordinary mornings with one bright laugh.'],
  // Day 4
  ['FAVOR', 'An act of kindness beyond what is required.', 'Every small favor from Fatema feels like love made visible.'],
  ['CANDY', 'A sweet food made mainly from sugar.', 'I saved the last candy because sharing it with you makes it taste better.'],
  ['LOYAL', 'Faithful and steadfast in support or affection.', 'Fatema is loyal through every change, and I treasure that steady love.'],
  // Day 5
  ['ALIVE', 'Living, active, or full of energy.', 'Every little plan feels alive when Fatema adds her imagination.'],
  ['BERRY', 'A small, juicy fruit without a stone.', 'I picked the ripest berry for you because you deserve the sweetest one.'],
  ['CUPID', 'The Roman god of love, often shown with a bow.', 'Cupid must have smiled the day our paths crossed.'],
  // Day 6
  ['AMBER', 'A warm yellow-orange color or fossilized tree resin.', 'The sunset turned amber while Fatema rested her hand in mine.'],
  ['BUNCH', 'A group of things gathered or fastened together.', 'A bunch of simple wildflowers always reminds me of your easy beauty.'],
  ['DANCE', 'To move rhythmically to music.', 'I would dance through every kitchen song if Fatema were my partner.'],
  // Day 7
  ['AROMA', 'A distinctive and usually pleasant smell.', 'The aroma of breakfast feels warmer when we share the table.'],
  ['CABIN', 'A small, simple house, often in the countryside.', 'A quiet cabin with Fatema would feel grander than any palace.'],
  ['DAISY', 'A small flower with white petals and a yellow center.', 'I tucked a daisy into Fatema\'s bouquet just to see her smile.'],
  // Day 8
  ['BEAUT', 'A beautiful person or thing.', 'Fatema is a true beaut, especially when kindness lights her face.'],
  ['CAROL', 'A joyful song, especially one sung at Christmas.', 'Your soft carol made our winter evening feel wonderfully peaceful.'],
  ['EMBER', 'A small glowing piece of coal or wood in a dying fire.', 'One warm ember kept glowing as we talked beside the fire.'],
  // Day 9
  ['ARDOR', 'Strong enthusiasm, passion, or affection.', 'My ardor for our life together grows steadier with every year.'],
  ['CIDER', 'A drink made from pressed apples.', 'Warm cider tastes best when Fatema and I share the same blanket.'],
  ['FANCY', 'Elaborate or decorative, or a feeling of liking someone.', 'We do not need a fancy evening when your company already feels special.'],
  // Day 10
  ['BLUSH', 'To become red in the face from emotion.', 'Fatema can still make me blush with one perfectly timed compliment.'],
  ['COCOA', 'A chocolate powder or a hot drink made from it.', 'I made cocoa for two and saved the softest blanket for you.'],
  ['TROVE', 'A store of valuable or delightful things.', 'Our photo box is a trove of little memories with Fatema.'],
  // Day 11
  ['AMOUR', 'A love affair or a person one loves.', 'My amour, every quiet day beside you feels beautifully complete.'],
  ['CORAL', 'A hard sea substance formed by tiny marine animals.', 'The coral sunset reminded me of the warm colors Fatema loves.'],
  ['GLEAM', 'A small or brief flash of light.', 'A playful gleam appears in your eyes whenever you plan a surprise.'],
  // Day 12
  ['BLEND', 'To mix smoothly or harmoniously together.', 'Our different ideas blend into a life that feels entirely our own.'],
  ['DOLLY', 'A child\'s informal word for a doll.', 'Fatema kept the little dolly because it carried a sweet family memory.'],
  ['HAPPY', 'Feeling or showing pleasure and contentment.', 'I am happiest when happy means a simple day spent with Fatema.'],
  // Day 13
  ['ADORN', 'To decorate or make something more beautiful.', 'Fresh flowers adorn the table, but Fatema is what brightens the room.'],
  ['CLOVE', 'An aromatic spice made from a dried flower bud.', 'A hint of clove warmed the dessert we baked together.'],
  ['IDEAL', 'Perfectly suited to a purpose or situation.', 'My ideal weekend begins with your hand in mine and no hurried plans.'],
  // Day 14
  ['BLESS', 'To ask for divine favor or bring happiness to.', 'You bless my days with patience, laughter, and steady love.'],
  ['FLOPS', 'Falls or drops down heavily or loosely.', 'Our puppy flops between us whenever we sit close on the sofa.'],
  ['JOLLY', 'Happy, cheerful, and friendly.', 'Fatema keeps the whole family jolly with her playful stories.'],
  // Day 15
  ['BOWER', 'A pleasant shady place beneath trees or climbing plants.', 'We found a leafy bower where we could sit and listen to the rain.'],
  ['GLOWS', 'Shines with a steady light or warm happiness.', 'Fatema glows whenever she talks about someone she loves.'],
  ['LOVES', 'Feels deep affection for someone or something.', 'Fatema loves with patience, honesty, and her whole heart.'],
  // Day 16
  ['AFFIX', 'To attach or fasten something to another thing.', 'I affix your tiny note to my desk so your words stay close all day.'],
  ['FLORA', 'The plants of a particular region or period.', 'Fatema notices every piece of flora along our favorite walking path.'],
  ['LOVER', 'A person who loves another person.', 'You are my lover, my confidante, and my favorite person to come home to.'],
  // Day 17
  ['ARISE', 'To get up or come into being.', 'Hope seems to arise naturally whenever Fatema says we will find a way.'],
  ['GAZES', 'Looks steadily and intently.', 'Fatema gazes at the stars while I quietly admire her wonder.'],
  ['MARRY', 'To become legally joined as spouses.', 'I would marry you again in every lifetime, Fatema.'],
  // Day 18
  ['BALMY', 'Pleasantly warm and mild.', 'A balmy evening gave us the perfect excuse for a long walk together.'],
  ['GIVER', 'A person who gives something.', 'Fatema is a generous giver of time, comfort, and second chances.'],
  ['NESTS', 'Structures where birds lay eggs and raise their young.', 'The tiny nests outside remind us how care can make any place a home.'],
  // Day 19
  ['BLAZE', 'A very large or fiercely burning fire.', 'The sunset was a blaze of color as we drove home hand in hand.'],
  ['GUEST', 'A person invited to visit or stay somewhere.', 'Every guest feels welcome when Fatema opens our door with a smile.'],
  ['OASIS', 'A fertile or peaceful place in the middle of difficulty.', 'Your calm voice is my oasis on a crowded, noisy day.'],
  // Day 20
  ['BUDDY', 'A close friend or companion.', 'Fatema is my travel buddy and the best part of every destination.'],
  ['HELLO', 'A greeting used when meeting or starting a conversation.', 'Your cheerful hello still feels like the beginning of something wonderful.'],
  ['PINKY', 'The smallest finger on a hand.', 'We sealed our tiny promise by linking each pinky under the table.'],
  // Day 21
  ['CARRY', 'To support and move something from one place to another.', 'I carry your encouraging words with me whenever a day feels difficult.'],
  ['CLASP', 'To hold someone or something closely and firmly.', 'I clasp Fatema\'s hand when I want to say that we are in this together.'],
  ['POESY', 'Poetry or poetic language.', 'No poesy could hold every reason I love you, Fatema.'],
  // Day 22
  ['FLAIR', 'A natural talent or distinctive sense of style.', 'Fatema\'s flair for kindness makes every gathering feel more welcoming.'],
  ['IVORY', 'A creamy white color or hard material from tusks.', 'The ivory ribbon looked elegant around Fatema\'s thoughtful gift.'],
  ['QUEEN', 'A female monarch or a woman held in highest regard.', 'Fatema is the queen of our home, ruling mostly through kindness and excellent snacks.'],
  // Day 23
  ['SKIES', 'The regions of air and space visible above Earth.', 'Pink skies stretched above us while Fatema chose our picnic spot.'],
  ['JEWEL', 'A precious stone or a highly valued person or thing.', 'Your honest heart is the jewel I treasure most.'],
  ['ROSES', 'Flowers known for layered petals and often associated with love.', 'I brought Fatema roses, and she made their beauty feel secondary.'],
  // Day 24
  ['CRUSH', 'A strong but sometimes brief romantic attraction.', 'My crush on Fatema never faded; it simply grew into lasting love.'],
  ['LAUGH', 'To make sounds that express amusement or happiness.', 'Your laugh is the music I hope fills every room we share.'],
  ['SHARE', 'To use, enjoy, or experience something with others.', 'I want to share every sunrise, snack, and small victory with you.'],
  // Day 25
  ['CLOSE', 'Near in distance or joined by strong affection.', 'I feel close to Fatema whenever we share our hopes honestly.'],
  ['SMART', 'Neat, stylish, or showing good judgment.', 'Fatema looks smart dressed up and just as lovely when she is relaxed.'],
  ['SUGAR', 'A sweet crystalline substance used in food and drinks.', 'Fatema adds less sugar to tea because her smile supplies enough sweetness.'],
  // Day 26
  ['EAGER', 'Enthusiastic and keen to do something.', 'I am always eager to hear what made Fatema laugh today.'],
  ['MUSIC', 'Organized sounds made to create beauty or emotion.', 'Our favorite music turns the kitchen into a tiny dance floor.'],
  ['TEDDY', 'A soft toy bear.', 'The old teddy on our shelf still carries a sweet story from Fatema\'s childhood.'],
  // Day 27
  ['FLAME', 'A hot glowing body of burning gas.', 'The candle flame flickered while we planned another year together.'],
  ['OPERA', 'A dramatic work sung with orchestral music.', 'Even a grand opera cannot match the emotion in Fatema\'s happy voice.'],
  ['UNITY', 'The state of being joined together or in agreement.', 'Our unity comes from choosing patience and honesty again and again.'],
  // Day 28
  ['GIDDY', 'Dizzy or lighthearted with excitement.', 'Fatema makes me feel giddy when she reaches for my hand unexpectedly.'],
  ['PUPPY', 'A young dog.', 'The puppy followed Fatema everywhere, clearly recognizing the kindest person in the room.'],
  ['VALOR', 'Great courage in the face of danger.', 'I admire the quiet valor Fatema shows when she stands up for someone.'],
  // Day 29
  ['GRAND', 'Magnificent, impressive, or important.', 'A simple dinner feels grand when Fatema is across the table.'],
  ['RINGS', 'Circular bands, often worn as jewelry.', 'Our rings are small reminders of the enormous promise we made.'],
  ['WALTZ', 'A dance in triple time performed by a turning couple.', 'I would waltz slowly with you even if the kitchen were our ballroom.'],
  // Day 30
  ['CIVIL', 'Courteous and respectful in behavior.', 'Fatema stays civil even when a conversation becomes difficult.'],
  ['ROMAN', 'Relating to ancient Rome or its people.', 'The Roman bridge was beautiful, but I kept watching Fatema admire it.'],
  ['YOURS', 'Belonging to or associated with you.', 'This grateful heart is yours, Fatema, today and always.'],
  // Day 31
  ['LOVED', 'Felt deep affection for someone or something.', 'Fatema is deeply loved for who she is, not merely for all she does.'],
  ['SCENT', 'A distinctive smell, especially a pleasant one.', 'The soft scent of jasmine always reminds me of evenings with you.'],
  ['ZESTY', 'Having a lively, pleasantly sharp flavor or energy.', 'Fatema made a zesty sauce that brightened our little dinner date.'],
  // Day 32
  ['MATES', 'Friends, partners, or companions.', 'We are best mates as well as partners, and that makes every journey easier.'],
  ['STARS', 'Bright celestial bodies visible in the night sky.', 'The stars looked close enough to touch when Fatema leaned against me.'],
  ['ABOVE', 'At a higher level or place.', 'The moon above seemed to follow us on our late walk home.'],
  // Day 33
  ['NOBLE', 'Having fine moral qualities or high ideals.', 'Fatema has a noble habit of defending people who are not in the room.'],
  ['TREAT', 'Something enjoyable given as a pleasure or reward.', 'Breakfast with Fatema is a treat even when it is only toast and tea.'],
  ['ACORN', 'The nut of an oak tree.', 'We kept one acorn from our walk as a tiny reminder of a perfect autumn day.'],
  // Day 34
  ['OCEAN', 'The vast body of salt water covering much of Earth.', 'The ocean sounded gentler while we watched it with our shoulders touching.'],
  ['VOWED', 'Made a solemn promise.', 'I vowed to keep choosing Fatema with tenderness in every season.'],
  ['ALBUM', 'A book or collection for photographs, music, or keepsakes.', 'Our album turns ordinary snapshots into a map of our happiest memories.'],
  // Day 35
  ['PATIO', 'A paved outdoor area beside a house.', 'We lingered on the patio because neither of us wanted the conversation to end.'],
  ['FIRES', 'Burning masses of flame and heat.', 'Small fires in the hearth make our winter evenings feel especially peaceful.'],
  ['AMAZE', 'To surprise someone greatly or fill them with wonder.', 'You amaze me, Fatema, with how much kindness you fit into one day.'],
  // Day 36
  ['RHYME', 'Words that share the same ending sound.', 'No rhyme sounds as lovely to me as Fatema paired with forever.'],
  ['HOPES', 'Feelings of expectation and desire for something good.', 'My hopes all include more time laughing beside Fatema.'],
  ['APRON', 'A protective garment worn over clothes while cooking.', 'Fatema tied on her apron and turned baking into our favorite date.'],
  // Day 37
  ['STILL', 'Calm, quiet, and without movement.', 'The garden felt still with Fatema reading peacefully beside me.'],
  ['WOODS', 'An area covered with trees.', 'We wandered through the woods and let the afternoon move slowly.'],
  ['ARROW', 'A pointed projectile shot from a bow.', 'Cupid\'s arrow must have had excellent aim when it led me to Fatema.'],
  // Day 38
  ['SOULS', 'The spiritual or emotional parts of people.', 'Our souls seem to recognize the same beauty in quiet, ordinary things.'],
  ['YOUTH', 'The period of life between childhood and adulthood.', 'Our love keeps the wonder of youth alive without losing the wisdom of time.'],
  ['BAKER', 'A person who makes bread and cakes.', 'My favorite baker is Fatema when she dusts flour from her smiling face.'],
  // Day 39
  ['CARES', 'Feels concern or affection for someone or something.', 'Fatema cares in ways that make difficult days gentler.'],
  ['ZEBRA', 'An African animal with black-and-white stripes.', 'Fatema spotted the zebra first and laughed at my delayed excitement.'],
  ['SWAYS', 'Moves slowly from side to side.', 'Fatema sways with me in the hallway even when there is no music.'],
  // Day 40
  ['TOUCH', 'To make physical contact with something.', 'The lightest touch of your hand still brings me immediate calm.'],
  ['ADMIT', 'To confess or acknowledge something as true.', 'I gladly admit that Fatema always chooses the better dessert.'],
  ['BENCH', 'A long seat for several people.', 'We found our favorite bench and watched the evening settle over the park.'],
  // Day 41
  ['TRULY', 'In a sincere, genuine, or truthful way.', 'I truly cherish the patient love Fatema gives so freely.'],
  ['AGLOW', 'Glowing with light, color, or happiness.', 'Fatema was aglow after hearing the good news she had worked toward.'],
  ['BIRDS', 'Warm-blooded animals with feathers, wings, and beaks.', 'The birds began singing while we shared an early cup of tea.'],
  // Day 42
  ['WHOLE', 'Complete, with no part missing.', 'Life feels whole when Fatema and I make room for both joy and rest.'],
  ['AISLE', 'A passage between rows of seats or shelves.', 'I would walk every aisle again for the joy of meeting you at the end.'],
  ['BRACE', 'To support, steady, or prepare something.', 'I brace for the cold, then forget it when Fatema slips her arm through mine.'],
  // Day 43
  ['WOMAN', 'An adult female person.', 'Fatema is the woman whose wisdom and warmth I admire most.'],
  ['ALOHA', 'A Hawaiian greeting expressing hello, goodbye, or love.', 'We said aloha to the island and carried its peaceful feeling home.'],
  ['BROOK', 'A small stream.', 'A clear brook sang beside us as Fatema unpacked our picnic.'],
  // Day 44
  ['YEARN', 'To feel a strong longing for something.', 'I yearn for home whenever work keeps me away from Fatema.'],
  ['AMUSE', 'To entertain or make someone laugh.', 'Fatema can amuse me with one raised eyebrow and no words at all.'],
  ['CAMEO', 'A small character role or a carved piece of jewelry.', 'Our cat made a cameo in every photo from our anniversary breakfast.'],
  // Day 45
  ['TOKEN', 'A small object that represents a feeling or fact.', 'I kept the ticket as a token of the first concert Fatema and I attended.'],
  ['SAINT', 'An exceptionally virtuous, kind, or patient person.', 'Fatema is a saint when she patiently helps me find what I misplaced.'],
  ['KEEPS', 'Continues to have, hold, or maintain something.', 'Fatema keeps our favorite photo where its happy memory stays close.'],
  // Day 46
  ['CLING', 'To hold on tightly to someone or something.', 'I cling to Fatema for one extra moment before a long trip.'],
  ['DOVES', 'Gentle birds often used as symbols of peace and love.', 'Two doves rested on the fence while we enjoyed breakfast outside.'],
  ['EDIFY', 'To instruct or improve someone morally or intellectually.', 'Fatema can edify without lecturing because she leads with compassion.'],
  // Day 47
  ['FIERY', 'Burning strongly or full of intense spirit.', 'Fatema\'s fiery determination inspires me to keep trying.'],
  ['GRINS', 'Smiles broadly.', 'Fatema grins whenever she catches me saving the best bite for her.'],
  ['HOMES', 'Places where people live and feel they belong.', 'The homes we admire most are the ones filled with laughter and welcome.'],
  // Day 48
  ['JELLY', 'A soft sweet food made from fruit juice and sugar.', 'Fatema spread jelly on my toast in the shape of a tiny heart.'],
  ['KUDOS', 'Praise given for an achievement.', 'All kudos belong to Fatema for turning our rushed meal into a celebration.'],
  ['LILAC', 'A shrub with fragrant purple or white flowers.', 'The lilac by our window bloomed just in time for Fatema\'s birthday.'],
  // Day 49
  ['MERRY', 'Cheerful and lively.', 'Fatema keeps our gatherings merry with stories everyone wants to hear.'],
  ['NURSE', 'A person trained to care for people who are ill or injured.', 'The nurse showed the same calm kindness that I admire in Fatema.'],
  ['OLIVE', 'A small oval fruit used for food and oil.', 'Fatema placed the last olive on my plate and called it true love.'],
  // Day 50
  ['PANSY', 'A garden flower with colorful rounded petals.', 'A purple pansy nodded in the breeze as we watered the garden together.'],
  ['QUILT', 'A warm bed covering made from stitched layers.', 'We curled beneath the quilt and let the rain provide the music.'],
  ['RIVER', 'A large natural stream of flowing water.', 'The river carried golden reflections while Fatema and I walked beside it.'],
  // Day 51
  ['SATIN', 'A smooth glossy fabric.', 'The satin ribbon on Fatema\'s gift matched her elegant taste.'],
  ['THYME', 'A fragrant herb used in cooking.', 'A little thyme made our shared soup smell wonderfully comforting.'],
  ['USHER', 'A person who guides people to their seats.', 'The usher smiled when he saw how carefully I held Fatema\'s hand.'],
  // Day 52
  ['VIVID', 'Producing strong, clear images or impressions.', 'My most vivid memory is Fatema laughing beneath a sudden summer rain.'],
  ['WATER', 'A clear liquid essential for life.', 'The water sparkled while we skipped stones and talked about our future.'],
  ['XENIA', 'Hospitality offered to a guest or stranger.', 'Fatema practices xenia by making every visitor feel genuinely welcome.'],
  // Day 53
  ['YOUNG', 'Having lived or existed for only a short time.', 'Your playful spirit keeps our love young, Fatema.'],
  ['AZURE', 'A bright blue color like a clear sky.', 'One azure ribbon stood out in the bouquet Fatema arranged.'],
  ['ACUTE', 'Sharp, intense, or highly perceptive.', 'Fatema has an acute sense for when someone needs encouragement.'],
  // Day 54
  ['BEAMS', 'Smiles radiantly or sends out rays of light.', 'Fatema beams whenever the family gathers around one table.'],
  ['CRANE', 'A tall long-legged bird or a machine for lifting.', 'A white crane crossed the lake while we stood quietly together.'],
  ['EXULT', 'To feel or show great happiness or triumph.', 'I exult in every success that makes Fatema proud of herself.'],
  // Day 55
  ['ELATE', 'To make someone very happy.', 'Your proud smile can elate me more than any award.'],
  ['FABLE', 'A short story that teaches a moral lesson.', 'The old fable reminded us that patient love outlasts pride.'],
  ['HERBS', 'Plants used to add flavor, fragrance, or medicine.', 'Our herbs grow best when Fatema chooses the pots and I carry the soil.'],
  // Day 56
  ['HAVEN', 'A safe and peaceful place.', 'Your embrace is my haven after a demanding day.'],
  ['IMAGE', 'A visual representation or mental picture.', 'My favorite image is Fatema smiling without realizing anyone is watching.'],
  ['JAUNT', 'A short trip taken for pleasure.', 'Our quick jaunt for coffee became a lovely afternoon together.'],
  // Day 57
  ['KNEEL', 'To rest on one or both knees.', 'I would kneel again with the same grateful heart and ask Fatema to choose me.'],
  ['LEMON', 'A yellow citrus fruit with sour juice.', 'Fatema added lemon to our tea and sunshine to the conversation.'],
  ['MANGO', 'A sweet tropical fruit with yellow-orange flesh.', 'We shared one ripe mango and laughed at the juice on our fingers.'],
  // Day 58
  ['NIGHT', 'The period of darkness between sunset and sunrise.', 'Every night feels peaceful when Fatema is resting beside me.'],
  ['ORBIT', 'The curved path of an object around another body.', 'My thoughts seem to orbit Fatema whenever we are apart.'],
  ['PLUSH', 'Soft, luxurious, and richly comfortable.', 'The plush blanket became our favorite place for weekend movies.'],
  // Day 59
  ['QUEST', 'A long search for something important.', 'My greatest quest ended when I found a life worth building with Fatema.'],
  ['RANCH', 'A large farm for raising livestock.', 'We visited a quiet ranch and watched the horses with our hands linked.'],
  ['SUNNY', 'Bright with sunlight or cheerful in mood.', 'Fatema has a sunny way of finding hope in an imperfect plan.'],
  // Day 60
  ['TULIP', 'A cup-shaped spring flower grown from a bulb.', 'The first tulip opened on the morning of our picnic.'],
  ['UNION', 'The state of being joined together.', 'Our union is strongest when we listen with patience and speak with care.'],
  ['VILLA', 'A large country house or vacation home.', 'Any little villa would feel luxurious with Fatema beside me.'],
  // Day 61
  ['WHALE', 'A very large marine mammal.', 'Fatema spotted the whale and squeezed my hand before pointing.'],
  ['YEAST', 'A fungus used to make dough rise and drinks ferment.', 'The yeast worked slowly while we talked over coffee in the kitchen.'],
  ['ZONAL', 'Relating to or arranged in zones.', 'The zonal garden plan gave Fatema a perfect corner for every flower.'],
  // Day 62
  ['ABIDE', 'To accept, obey, or remain in a place.', 'My promise will abide through busy weeks and quiet years alike.'],
  ['BRUSH', 'A tool with bristles, or a light sweeping contact.', 'The gentle brush of Fatema\'s hand made me smile during the movie.'],
  ['CROWN', 'A ceremonial headpiece worn by a monarch.', 'No crown could make Fatema more regal than her generous character already does.'],
  // Day 63
  ['DWELL', 'To live in a place or think at length about something.', 'I try not to dwell on worries when Fatema reminds me of all we have overcome.'],
  ['ENJOY', 'To take pleasure in something.', 'I enjoy even grocery shopping when Fatema turns it into time together.'],
  ['FEAST', 'A large special meal.', 'Our feast was simple, but laughter made every dish memorable.'],
  // Day 64
  ['GLADE', 'An open space in a forest.', 'We found a sunny glade and stayed until the shadows grew long.'],
  ['HUMOR', 'The quality of being amusing or the ability to see what is funny.', 'Fatema\'s gentle humor can rescue even a frustrating afternoon.'],
  ['INLAY', 'A decorative material set into the surface of an object.', 'The pearl inlay on the box reminded me of Fatema\'s careful eye for beauty.'],
  // Day 65
  ['JAZZY', 'Bright, lively, or showy.', 'Fatema chose a jazzy scarf that made the whole outfit feel joyful.'],
  ['KNACK', 'A natural skill or clever way of doing something.', 'Fatema has a knack for making new people feel like old friends.'],
  ['LOTUS', 'A water plant with large floating leaves and showy flowers.', 'A pink lotus opened while we crossed the quiet garden bridge.'],
  // Day 66
  ['MAPLE', 'A tree known for lobed leaves and sweet sap.', 'The maple turned red above the path where Fatema and I first walked together.'],
  ['NIECE', 'A daughter of one\'s sibling or sibling-in-law.', 'Our niece ran straight to Fatema because she always makes time to listen.'],
  ['OUNCE', 'A small unit of weight.', 'Not one ounce of my gratitude for Fatema could fit into a single note.'],
  // Day 67
  ['PETAL', 'One of the colored parts forming a flower.', 'A rose petal landed on Fatema\'s sleeve during our garden walk.'],
  ['QUICK', 'Moving or happening with speed.', 'Fatema gave me a quick kiss before racing out with a happy wave.'],
  ['ROBIN', 'A small bird known for its red or orange breast.', 'A robin sang outside while we prepared breakfast together.'],
  // Day 68
  ['SAVOR', 'To enjoy something slowly and fully.', 'I savor every unhurried morning I get to spend with Fatema.'],
  ['TRAIL', 'A path through countryside or wilderness.', 'The trail felt shorter because Fatema filled it with good conversation.'],
  ['URBAN', 'Relating to a city or town.', 'Our urban walk led us to a tiny cafe that became our new favorite.'],
  // Day 69
  ['VERSE', 'A line or group of lines in a poem or song.', 'Every verse of our favorite song brings back a memory of Fatema.'],
  ['WAFER', 'A thin, crisp biscuit or slice of material.', 'Fatema split the last wafer exactly in half for us.'],
  ['YACHT', 'A sailboat or motorboat used for pleasure.', 'A yacht passed in the distance while we enjoyed our humble picnic ashore.'],
  // Day 70
  ['TANGY', 'Having a pleasantly sharp or acidic flavor.', 'The tangy lemonade kept our picnic bright and refreshing.'],
  ['ALERT', 'Watchful, attentive, and quick to notice things.', 'Fatema stays alert to the small details that make people feel cared for.'],
  ['BLADE', 'The flat cutting part of a tool or a leaf of grass.', 'A blade of grass clung to our picnic blanket as we packed up slowly.'],
  // Day 71
  ['CLIFF', 'A steep rock face, especially beside water.', 'We watched the sea from the cliff and held hands against the wind.'],
  ['DRIFT', 'To move slowly without a fixed direction.', 'We let the afternoon drift by while Fatema read beside me.'],
  ['ECLAT', 'Brilliant success or enthusiastic public praise.', 'Fatema accepted the eclat with grace and thanked everyone who helped.'],
  // Day 72
  ['FRESH', 'New, recently made, or pleasantly clean and cool.', 'Fresh flowers on the table reminded Fatema that I was thinking of her.'],
  ['GIANT', 'An unusually large person, creature, or thing.', 'A giant moon rose above us on our quiet drive home.'],
  ['HOLLY', 'An evergreen shrub with glossy leaves and red berries.', 'A sprig of holly made the little winter gift look festive.'],
  // Day 73
  ['INNER', 'Situated inside or closer to the center.', 'Fatema knows my inner worries and answers them with patient reassurance.'],
  ['FUNNY', 'Causing laughter or amusement.', 'Fatema tells a funny story in a way that makes every guest relax.'],
  ['KAYAK', 'A narrow small boat moved with a double-bladed paddle.', 'Our kayak wobbled because Fatema and I could not stop laughing.'],
  // Day 74
  ['LATCH', 'A simple fastening for a door or gate.', 'I lifted the garden latch and let Fatema discover the flowers first.'],
  ['MIRTH', 'Amusement expressed through laughter and happiness.', 'Fatema\'s story filled the room with genuine mirth.'],
  ['NOVEL', 'A long fictional prose story, or something new and unusual.', 'We traded the same novel back and forth, leaving notes in the margins.'],
  // Day 75
  ['OPINE', 'To express an opinion.', 'I asked Fatema to opine because her thoughtful view always improves the plan.'],
  ['PRIZE', 'Something awarded or greatly valued.', 'The real prize was seeing Fatema proud of what we accomplished together.'],
  ['REVEL', 'To take great pleasure in something.', 'We revel in slow breakfasts whenever the weekend gives us time.'],
  // Day 76
  ['SCARF', 'A length of fabric worn around the neck or head.', 'Fatema wrapped my scarf more snugly before we stepped into the cold.'],
  ['TOAST', 'Bread browned by heat or a ceremonial expression of goodwill.', 'We raised a toast to another year of choosing each other.'],
  ['ULTRA', 'Extreme or beyond the usual degree.', 'Fatema called the dessert ultra rich, then happily shared another bite.'],
  // Day 77
  ['VOICE', 'The sound produced when a person speaks or sings.', 'Fatema\'s voice is the calmest sound at the end of a long day.'],
  ['WRIST', 'The joint connecting the hand and forearm.', 'The bracelet on Fatema\'s wrist carried a charm from our first trip.'],
  ['YUMMY', 'Delicious or very appealing.', 'Fatema declared the cake yummy, which made our messy baking worthwhile.'],
  // Day 78
  ['ZIPPY', 'Bright, lively, and energetic.', 'Her zippy little tune kept us smiling during the drive.'],
  ['ALTAR', 'A raised structure used in worship or ceremonies.', 'At the altar, I felt grateful that Fatema had chosen a life with me.'],
  ['BASIN', 'A wide open container or a natural bowl-shaped area.', 'We washed berries in the basin before sharing them on the porch.'],
  // Day 79
  ['CHIME', 'A melodious ringing sound or a set of tuned bells.', 'The wind chime sang while Fatema watered the flowers.'],
  ['DOZEN', 'A group of twelve.', 'A dozen roses still cannot express one full day of my gratitude for you.'],
  ['EXALT', 'To praise highly or raise in status.', 'I exalt Fatema\'s kindness because it quietly changes lives.'],
  // Day 80
  ['FROST', 'A thin layer of ice crystals formed in cold weather.', 'The frost glittered as Fatema and I stepped outside for an early walk.'],
  ['GLORY', 'Great beauty, honor, or magnificence.', 'The glory of the sunrise felt complete when Fatema stopped to admire it.'],
  ['HERON', 'A long-legged bird that lives near water.', 'A heron stood perfectly still while we whispered beside the pond.'],
  // Day 81
  ['ISSUE', 'An important topic or a problem to resolve.', 'No issue feels impossible when Fatema and I face it as a team.'],
  ['JAMMY', 'Covered with jam or informally very lucky.', 'My jammy toast came with a little heart drawn by Fatema.'],
  ['KARMA', 'The idea that actions influence future consequences.', 'Good karma seems to follow Fatema because generosity guides her choices.'],
  // Day 82
  ['LEAFY', 'Covered with or having many leaves.', 'We chose the leafy path because it promised a cooler walk together.'],
  ['MOCHA', 'Coffee mixed with chocolate.', 'A warm mocha and Fatema\'s company made the rainy cafe feel perfect.'],
  ['NINTH', 'Coming after the eighth in a sequence.', 'On our ninth stop, we found the tiny bakery Fatema had hoped to visit.'],
  // Day 83
  ['OWLET', 'A young or small owl.', 'The little owlet watched us from a branch as dusk arrived.'],
  ['PLAZA', 'An open public square in a town or city.', 'Music filled the plaza while Fatema and I shared a quiet dance.'],
  ['QUILL', 'A large feather or an old-fashioned pen made from one.', 'I would use a quill if that made my love letter worthy of Fatema.'],
  // Day 84
  ['RIPEN', 'To become fully mature and ready to eat.', 'We waited for the peaches to ripen before planning our picnic dessert.'],
  ['SHORE', 'Land along the edge of a sea, lake, or river.', 'We walked the shore until the sky turned violet behind us.'],
  ['TWINE', 'Strong thread made from twisted strands.', 'Fatema tied the parcel with twine and tucked a flower beneath the bow.'],
  // Day 85
  ['UNCLE', 'The brother of a parent or the husband of an aunt.', 'Our uncle smiled as Fatema made sure everyone had a seat.'],
  ['VISTA', 'A pleasing distant view through an opening or from a height.', 'The mountain vista was stunning, but sharing it with you mattered more.'],
  ['TANGO', 'A dramatic partner dance that began near the River Plate.', 'One playful tango with Fatema turned our living room into a ballroom.'],
  // Day 86
  ['XERIC', 'Very dry or adapted to dry conditions.', 'The xeric garden surprised Fatema with its delicate desert flowers.'],
  ['LONGS', 'Feels a strong desire or longing for something.', 'My heart longs for Fatema\'s laugh whenever travel keeps us apart.'],
  ['ZONED', 'Divided into areas for particular purposes.', 'Fatema zoned the shelf so every keepsake had a thoughtful place.'],
  // Day 87
  ['AMBLE', 'To walk at a slow, relaxed pace.', 'We amble through the market because Fatema enjoys every colorful stall.'],
  ['BUNNY', 'A rabbit, especially a young or small one.', 'A tiny bunny paused near our path and completely won Fatema\'s heart.'],
  ['SPICE', 'An aromatic substance used to flavor food.', 'One spice gave the warm drink a scent that filled our kitchen.'],
  // Day 88
  ['DRAPE', 'To hang or arrange fabric in loose folds.', 'Fatema chose to drape the soft blanket over both our shoulders.'],
  ['ETHIC', 'A moral principle that guides behavior.', 'Fatema\'s ethic of quiet generosity shapes the way our home welcomes others.'],
  ['FJORD', 'A long narrow sea inlet between steep cliffs.', 'The fjord looked unreal as Fatema stood beside me in the morning mist.'],
  // Day 89
  ['GROVE', 'A small group of trees.', 'We found a shaded grove and shared the lunch Fatema had packed.'],
  ['HASTE', 'Excessive speed or urgency.', 'We left haste behind and let our anniversary dinner last all evening.'],
  ['ASTER', 'A daisy-like flower with many narrow petals.', 'The first aster bloomed just as Fatema began planning our spring picnic.'],
  // Day 90
  ['PINES', 'Evergreen trees with needle-shaped leaves and cones.', 'The pines along the trail made our winter walk smell fresh and crisp.'],
  ['KIOSK', 'A small open-fronted booth or stand.', 'We bought tea from the kiosk and shared it beside the fountain.'],
  ['LUNAR', 'Relating to the moon.', 'The lunar glow made Fatema\'s smile look especially soft.'],
  // Day 91
  ['MERCY', 'Compassion shown toward someone in one\'s power.', 'Fatema chooses mercy without giving up honesty or wisdom.'],
  ['NORTH', 'The direction toward the top of most maps.', 'Wherever north leads, I am content if Fatema is traveling with me.'],
  ['OFFER', 'To present something for acceptance or refusal.', 'I offer Fatema the first sip because love lives in small courtesies.'],
  // Day 92
  ['PILOT', 'A person who operates an aircraft or guides a vessel.', 'Fatema is my favorite road-trip pilot even when I am holding the map.'],
  ['QUART', 'A unit of liquid capacity equal to two pints.', 'A quart of strawberries became dessert after Fatema added cream.'],
  ['REACH', 'To stretch out or arrive at a destination.', 'I reach for Fatema\'s hand whenever the path grows uneven.'],
  // Day 93
  ['SHEEN', 'A soft shine on a surface.', 'The candlelight gave a warm sheen to the table Fatema had arranged.'],
  ['TIARA', 'A jeweled ornamental band worn on the head.', 'Fatema wore the paper tiara proudly through our silly birthday breakfast.'],
  ['UPLIT', 'Lit from below.', 'The uplit fountain shimmered behind us during our evening walk.'],
  // Day 94
  ['VEGAN', 'A person who avoids animal products or food made without them.', 'Fatema found a vegan dessert so delicious that everyone asked for the recipe.'],
  ['WIDEN', 'To make or become broader.', 'My smile seems to widen whenever Fatema walks into view.'],
  ['XYLEM', 'Plant tissue that carries water from roots upward.', 'Fatema explained how xylem helps the flowers in our garden stand tall.'],
  // Day 95
  ['YIELD', 'To produce, provide, or give way.', 'Our little garden will yield herbs for the dinners Fatema loves to make.'],
  ['ZINGY', 'Pleasantly sharp, lively, or full of energy.', 'The zingy lemonade matched Fatema\'s bright mood at our picnic.'],
  ['ADIEU', 'A farewell or goodbye.', 'We said adieu to the seaside and promised to return together.'],
  // Day 96
  ['BELLE', 'A beautiful and admired woman.', 'Fatema was the belle of the evening because her warmth drew everyone close.'],
  ['CRISP', 'Firm, fresh, and pleasantly brittle or cool.', 'The crisp morning air made our shared coffee taste even better.'],
  ['DOWRY', 'Property or money brought by a bride to a marriage.', 'Our true dowry was the trust and hope both families gave us.'],
  // Day 97
  ['EMOTE', 'To express emotion openly or theatrically.', 'Fatema can emote through one glance during our favorite film.'],
  ['FLOUR', 'Powder made by grinding grain, used in baking.', 'A dusting of flour on Fatema\'s cheek made our baking date even sweeter.'],
  ['GUSTO', 'Enthusiastic enjoyment or vigor.', 'Fatema sings with gusto whenever our favorite song starts.'],
  // Day 98
  ['HEDGE', 'A row of closely planted shrubs forming a boundary.', 'The flowering hedge made a lovely backdrop for Fatema\'s photo.'],
  ['INBOX', 'A folder or tray for incoming messages.', 'My inbox feels friendlier whenever a note from Fatema appears.'],
  ['JOKES', 'Things said or done to cause laughter.', 'Fatema\'s jokes keep our family smiling through every celebration.'],
  // Day 99
  ['KOALA', 'An Australian tree-dwelling marsupial.', 'The sleepy koala became Fatema\'s favorite animal at the sanctuary.'],
  ['LOFTY', 'Very high or noble in aim.', 'Our lofty plans always begin with one practical list from Fatema.'],
  ['MOUNT', 'To climb, rise, or place something in position.', 'We mount each new photo carefully because every memory with Fatema matters.'],
  // Day 100
  ['NEVER', 'At no time or not under any condition.', 'I never take for granted the steady love Fatema brings to our life.'],
  ['OVERT', 'Open and clearly visible rather than hidden.', 'My overt admiration for Fatema makes secrecy impossible.'],
  ['PEACE', 'Freedom from conflict or a state of calm.', 'Peace settles over me whenever Fatema rests her head on my shoulder.'],
];

// Generated from words.js with the same two-pass scoring used by app.js.
// The validator proves every clue has >=2 exact, >=1 present, and >=1 absent.
export const NEW_PUZZLE_CLUES = [
  'GROPE', 'ALBUM', 'CAMEO', 'EAGER', 'SKIES', 'BREAD', 'FAITH', 'BREAD', 'CHARM', 'TAROT', 'HEADY', 'LOUSY',
  'BRAVE', 'RETRO', 'CLOUD', 'BOWER', 'BLUSH', 'GRACE', 'GROAN', 'CHAIR', 'AMITY', 'BRAVE', 'FAVOR', 'CHEER',
  'FAVOR', 'CHAIR', 'CANDY', 'HOUSE', 'CAROL', 'ADORE', 'PROUD', 'WORLD', 'GLIDE', 'PLANE', 'WORLD', 'HEADY',
  'GROAN', 'WHOLE', 'BREAD', 'BEAST', 'CLOSE', 'LOUSY', 'AMBER', 'CLOSE', 'HOVEL', 'MAFIA', 'ADORE', 'HOVEL',
  'BRAVE', 'EAGER', 'SCARY', 'MARRY', 'TIGER', 'ROSES', 'BEACH', 'QUIET', 'ROSES', 'DANDY', 'DOLLY', 'ZIPPY',
  'CHARM', 'PLANT', 'HONEY', 'FAVOR', 'FIERY', 'KNEEL', 'SHINE', 'JELLY', 'BOWER', 'HOUSE', 'LEASH', 'BRAVE',
  'HOUSE', 'CHARM', 'EAGER', 'EARTH', 'CUPID', 'ZESTY', 'ALIVE', 'SPARK', 'INLAY', 'GLIDE', 'APPLY', 'TAROT',
  'BREAD', 'FIRES', 'WATER', 'CLAIM', 'GROAN', 'HOUSE', 'WORLD', 'SHINE', 'TEDDY', 'CAMEO', 'HEART', 'BRAVE',
  'WHOLE', 'TAROT', 'GROAN', 'CREAM', 'WORLD', 'BLOOM', 'OASIS', 'TIGER', 'AMBER', 'SHARE', 'HOUSE', 'TAROT',
  'STEIN', 'WORLD', 'TAROT', 'HOUSE', 'HOUSE', 'AMBER', 'EARTH', 'HEART', 'SCARY', 'HOUSE', 'ADIEU', 'DANCE',
  'LOUSY', 'VALOR', 'BLISS', 'WORLD', 'SMILE', 'PEACH', 'GROAN', 'ALTAR', 'BOOST', 'HEADY', 'SMILE', 'COMFY',
  'HONEY', 'FAITH', 'KNEEL', 'CHILD', 'LOVED', 'DAISY', 'BERRY', 'SHINE', 'HOUSE', 'LOWLY', 'AUDIO', 'LOYAL',
  'RETRO', 'HOUSE', 'SMILE', 'HAPPY', 'STILL', 'FIRES', 'STEIN', 'THIEF', 'CHEER', 'VIDEO', 'TIGER', 'HELIX',
  'LOUSY', 'ARISE', 'UNITE', 'BRAVE', 'CHAIR', 'TRULY', 'EARTH', 'APPLE', 'BERRY', 'HONEY', 'GRACE', 'PLANT',
  'QUEEN', 'ROMAN', 'MAGIC', 'TIGER', 'ROBIN', 'HOUSE', 'QUIET', 'EARTH', 'PANSY', 'CUPID', 'INBOX', 'VALOR',
  'APPLE', 'HEADY', 'ROMAN', 'ADORE', 'HOUSE', 'ADORN', 'DOLLY', 'DECOY', 'GUEST', 'HEADY', 'HOMES', 'IDEAL',
  'CRAZY', 'KAYAK', 'LOUSY', 'SMILE', 'DANCE', 'BENCH', 'PEACH', 'TRUCK', 'NOBLE', 'TAROT', 'CHAIR', 'BREAD',
  'ARISE', 'FAVOR', 'YEAST', 'ANNOY', 'HEART', 'BEACH', 'CHILD', 'BRIDE', 'SCENT', 'LEASH', 'LIGHT', 'HOVEL',
  'TIGER', 'FOUND', 'KNACK', 'EARTH', 'FAITH', 'HONEY', 'PLANE', 'GRAPE', 'PEARL', 'CHARM', 'TAROT', 'ALERT',
  'ALIVE', 'WORST', 'MUDDY', 'PINKY', 'FLAIR', 'STEIN', 'CHAIR', 'HONEY', 'HEART', 'WORST', 'GROAN', 'HEART',
  'AISLE', 'MARRY', 'AROMA', 'PEARL', 'ALOHA', 'FAITH', 'ECLAT', 'PEARL', 'PUPIL', 'TIGER', 'GROPE', 'THIEF',
  'NOBLE', 'AISLE', 'TAROT', 'ETHIC', 'LOUSY', 'TOKEN', 'LADLE', 'HUBBY', 'ARISE', 'PLANE', 'STEIN', 'PROUD',
  'ADORE', 'EARTH', 'TIGER', 'SKIES', 'BRISK', 'ZONAL', 'CARRY', 'WORST', 'BOWER', 'LIGHT', 'BEAUT', 'GRACE',
  'SHINE', 'HEART', 'PILOT', 'GROAN', 'DOZEN', 'ALLEY', 'CHILD', 'GIDDY', 'QUIET', 'LADLE', 'GRINS', 'BOWER',
  'EMBER', 'PROUD', 'GUEST', 'HEADY', 'UNION', 'JESTS', 'KARMA', 'COMFY', 'YOUTH', 'CHEER', 'HEART', 'GRAPE',
];
