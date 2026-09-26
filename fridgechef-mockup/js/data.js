/* All dummy data + the seed state. Nothing here talks to a network except Unsplash image URLs. */
FC.data = (function () {
  const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 600}&q=70`;
  const { daysAgo } = FC.util;

  // Photos the dummy camera "captures" and the dummy gallery offers
  const library = [
    { id: 'lib1', label: 'Fridge', src: U('1571175443880-49e1d25b2bc5', 800) },
    { id: 'lib2', label: 'Pantry shelf', src: U('1604719312566-8912e9227c6a', 800) },
    { id: 'lib3', label: 'Spice rack', src: U('1596040033229-a9821ebd058d', 800) },
    { id: 'lib4', label: 'Vegetables', src: U('1540420773420-3366772f4999', 800) },
    { id: 'lib5', label: 'Grocery haul', src: U('1588964895597-cfccd6e2dbf9', 800) },
    { id: 'lib6', label: 'Dairy shelf', src: U('1550583724-b2692b85b150', 800) },
  ];

  const onboarding = [
    { kicker: 'Step 01', title: 'Snap', body: 'Take a few photos of your fridge, pantry and shelves - or pick them straight from your gallery.', image: U('1571175443880-49e1d25b2bc5', 900) },
    { kicker: 'Step 02', title: 'Confirm', body: 'Photos can fool anyone. Slide to the real amount so every recipe fits what you actually have.', image: U('1540420773420-3366772f4999', 900) },
    { kicker: 'Step 03', title: 'Cook', body: 'Tell us your mood, time and energy. Get doable recipes - with your spices already remembered.', image: U('1603894584373-5ac82b2ae398', 900) },
  ];

  // What the "AI" finds. photoIndex = which photo it was spotted in (fewer photos → fewer items).
  // value is always stored in `unit`; `alt` lets the user view it in another unit (factor = unit per alt unit).
  const detected = [
    { id: 'chicken', name: 'Chicken breast', category: 'Protein', unit: 'g', min: 100, max: 1500, step: 50, aiEstimate: 500, confidence: 'low', photoIndex: 0, img: U('1604503468506-a8da13d82791', 200) },
    { id: 'paneer', name: 'Paneer', category: 'Dairy', unit: 'g', min: 0, max: 1000, step: 25, aiEstimate: 200, confidence: 'low', photoIndex: 0, img: U('1567188040759-fb8a883dc6d8', 200) },
    { id: 'yogurt', name: 'Yogurt', category: 'Dairy', unit: 'g', min: 0, max: 1000, step: 50, aiEstimate: 400, confidence: 'low', photoIndex: 0, img: U('1488477181946-6428a0291777', 200) },
    { id: 'rice', name: 'Rice', category: 'Grains', unit: 'g', min: 0, max: 5000, step: 100, aiEstimate: 1500, confidence: 'med', photoIndex: 1, img: U('1586201375761-83865001e31c', 200) },
    { id: 'onion', name: 'Onion', category: 'Veg', unit: 'pcs', min: 0, max: 12, step: 1, aiEstimate: 3, confidence: 'med', photoIndex: 1, img: U('1618512496248-a07fe83aa8cb', 200), alt: { unit: 'g', factor: 1 / 110, step: 50 } },
    { id: 'spinach', name: 'Spinach', category: 'Veg', unit: 'bunch', min: 0, max: 4, step: 0.5, aiEstimate: 1, confidence: 'med', photoIndex: 0, img: U('1576045057995-568f588f82fb', 200), alt: { unit: 'g', factor: 1 / 250, step: 25 } },
    { id: 'eggs', name: 'Eggs', category: 'Protein', unit: 'pcs', min: 0, max: 30, step: 1, aiEstimate: 6, confidence: 'high', photoIndex: 0, img: U('1582722872445-44dc5f7e3c8f', 200), alt: { unit: 'g', factor: 1 / 50, step: 50 } },
    { id: 'tomato', name: 'Tomatoes', category: 'Veg', unit: 'pcs', min: 0, max: 15, step: 1, aiEstimate: 4, confidence: 'high', photoIndex: 0, img: U('1592924357228-91a4daadcfea', 200), alt: { unit: 'g', factor: 1 / 100, step: 50 } },
    { id: 'milk', name: 'Milk', category: 'Dairy', unit: 'ml', min: 0, max: 2000, step: 50, aiEstimate: 750, confidence: 'high', photoIndex: 0, img: U('1563636619-e9143da7973b', 200), alt: { unit: 'cups', factor: 240, step: 0.25 } },
    { id: 'pepper', name: 'Bell pepper', category: 'Veg', unit: 'pcs', min: 0, max: 8, step: 1, aiEstimate: 2, confidence: 'high', photoIndex: 0, img: U('1563565375-f3fdfdbefa83', 200) },
    { id: 'garlic', name: 'Garlic', category: 'Veg', unit: 'cloves', min: 0, max: 30, step: 1, aiEstimate: 10, confidence: 'high', photoIndex: 1, img: U('1540148426945-6cf22a6b2383', 200) },
    { id: 'lemon', name: 'Lemon', category: 'Fruit', unit: 'pcs', min: 0, max: 10, step: 1, aiEstimate: 2, confidence: 'high', photoIndex: 1, img: U('1590502593747-42a996133562', 200) },
  ];

  // "Add missed item" quick picks (also the names of recipe ingredients the user may not have)
  const addable = [
    { id: 'cream', name: 'Fresh cream', unit: 'ml', min: 0, max: 500, step: 25, value: 200 },
    { id: 'bread', name: 'Bread', unit: 'slices', min: 0, max: 20, step: 1, value: 8 },
    { id: 'pasta', name: 'Pasta', unit: 'g', min: 0, max: 1000, step: 50, value: 500 },
    { id: 'tortilla', name: 'Tortillas', unit: 'pcs', min: 0, max: 12, step: 1, value: 6 },
    { id: 'cheese', name: 'Cheese', unit: 'g', min: 0, max: 500, step: 25, value: 200 },
    { id: 'potato', name: 'Potato', unit: 'pcs', min: 0, max: 12, step: 1, value: 4 },
    { id: 'mushroom', name: 'Mushrooms', unit: 'g', min: 0, max: 500, step: 25, value: 200 },
    { id: 'carrot', name: 'Carrot', unit: 'pcs', min: 0, max: 10, step: 1, value: 3 },
    { id: 'cilantro', name: 'Cilantro', unit: 'bunch', min: 0, max: 3, step: 0.5, value: 1 },
    { id: 'cucumber', name: 'Cucumber', unit: 'pcs', min: 0, max: 6, step: 1, value: 2 },
  ];

  // Pantry staples. level is 0–5 bars (fractional allowed); perLevel = recipe units that use up one bar.
  const S = (id, name, category, unitHint, level, ago, unit, perLevel) =>
    ({ id, name, category, unitHint, level, updatedAt: daysAgo(ago), unit, perLevel, lowThreshold: 1.5 });
  const staples = [
    S('turmeric', 'Turmeric', 'Spices', '~100 g jar', 1, 14, 'tsp', 4),
    S('red_chilli', 'Red chilli powder', 'Spices', '~100 g jar', 1.75, 9, 'tsp', 4),
    S('garam_masala', 'Garam masala', 'Spices', '~50 g jar', 1.75, 12, 'tsp', 4),
    S('cumin', 'Cumin seeds', 'Spices', '~100 g jar', 3.5, 6, 'tsp', 4),
    S('coriander', 'Coriander powder', 'Spices', '~100 g jar', 4, 20, 'tsp', 4),
    S('mustard_seeds', 'Mustard seeds', 'Spices', '~100 g jar', 3, 30, 'tsp', 4),
    S('black_pepper', 'Black pepper', 'Spices', '~50 g grinder', 2.5, 4, 'tsp', 4),
    S('salt', 'Salt', 'Spices', '1 kg pack', 1, 21, 'tsp', 20),
    S('oregano', 'Oregano', 'Spices', '~20 g jar', 4, 40, 'tsp', 4),
    S('chilli_flakes', 'Chilli flakes', 'Spices', '~40 g jar', 3, 15, 'tsp', 4),
    S('olive_oil', 'Olive oil', 'Oils & Fats', '1 L bottle', 1.5, 3, 'tbsp', 8),
    S('mustard_oil', 'Mustard oil', 'Oils & Fats', '1 L bottle', 4, 10, 'tbsp', 8),
    S('ghee', 'Ghee', 'Dairy basics', '500 ml jar', 3, 7, 'tbsp', 6),
    S('butter', 'Butter', 'Dairy basics', '500 g block', 2.5, 2, 'tbsp', 4),
    S('soy_sauce', 'Soy sauce', 'Sauces', '200 ml bottle', 3.5, 18, 'tbsp', 6),
    S('vinegar', 'Vinegar', 'Sauces', '500 ml bottle', 4, 45, 'tbsp', 8),
    S('ketchup', 'Tomato ketchup', 'Sauces', '500 g bottle', 2, 5, 'tbsp', 6),
    S('gg_paste', 'Ginger-garlic paste', 'Sauces', '200 g jar', 3, 8, 'tsp', 8),
    S('basmati', 'Basmati rice', 'Grains & Flours', '5 kg bag', 4, 25, 'cup', 2),
    S('atta', 'Atta', 'Grains & Flours', '5 kg bag', 4.5, 11, 'cup', 3),
    S('besan', 'Besan', 'Grains & Flours', '1 kg pack', 2.5, 16, 'cup', 1.5),
    S('maida', 'Maida', 'Grains & Flours', '1 kg pack', 3, 33, 'cup', 2),
    S('sugar', 'Sugar', 'Baking', '1 kg pack', 3.5, 9, 'tsp', 30),
    S('baking_powder', 'Baking powder', 'Baking', '100 g tin', 4, 60, 'tsp', 5),
    S('honey', 'Honey', 'Baking', '250 g jar', 2, 13, 'tbsp', 6),
  ];

  const stapleSuggestions = [
    { name: 'Cardamom', category: 'Spices' }, { name: 'Cinnamon', category: 'Spices' },
    { name: 'Cloves', category: 'Spices' }, { name: 'Bay leaf', category: 'Spices' },
    { name: 'Paprika', category: 'Spices' }, { name: 'Hing', category: 'Spices' },
    { name: 'Sesame oil', category: 'Oils & Fats' }, { name: 'Peanut butter', category: 'Sauces' },
    { name: 'Cornflour', category: 'Grains & Flours' }, { name: 'Jaggery', category: 'Baking' },
  ];

  // Recipes. Ingredient ids point at detected items, staples or `addable` extras. qty is for `servings`.
  const R = (o) => Object.assign({ servings: 2, onePan: false, equipment: ['stove'], swaps: [] }, o);
  const recipes = [
    R({
      id: 'butter-chicken', name: 'Butter Chicken Lite', subtitle: 'Creamy tomato gravy, easy on the butter',
      cuisine: 'Indian', diet: 'nonveg', timeMin: 35, effort: 3, spice: 3, kcal: 540, protein: 38, carbs: 22, fat: 30,
      moods: ['comfort', 'date'], image: U('1603894584373-5ac82b2ae398', 900),
      ingredients: [
        { id: 'chicken', qty: 400, unit: 'g' }, { id: 'tomato', qty: 3, unit: 'pcs' }, { id: 'onion', qty: 1, unit: 'pcs' },
        { id: 'yogurt', qty: 100, unit: 'g' }, { id: 'garlic', qty: 4, unit: 'cloves' }, { id: 'cream', qty: 50, unit: 'ml' },
        { id: 'butter', qty: 1, unit: 'tbsp' }, { id: 'garam_masala', qty: 1, unit: 'tsp' }, { id: 'red_chilli', qty: 1, unit: 'tsp' },
        { id: 'gg_paste', qty: 1, unit: 'tsp' }, { id: 'salt', qty: 1, unit: 'tsp' },
      ],
      steps: [
        { text: 'Toss the chicken with yogurt, chilli, ginger-garlic paste and salt. Rest while you prep.', minutes: 10 },
        { text: 'Sear the chicken in half the butter until golden. Set aside.', minutes: 6 },
        { text: 'Cook onion, garlic and tomatoes down to a thick, jammy purée.', minutes: 10 },
        { text: 'Stir in garam masala, return the chicken, add cream and simmer.', minutes: 8 },
        { text: 'Finish with the rest of the butter. Serve with rice or roti.', minutes: 1 },
      ],
      swaps: [{ missing: 'Fresh cream', use: 'Whisk 2 tbsp yogurt with 1 tsp butter - stir in off the heat.' }, { missing: 'Butter', use: 'Ghee works 1:1 and tastes even richer.' }],
    }),
    R({
      id: 'palak-paneer', name: 'Palak Paneer', subtitle: 'Silky spinach, soft paneer cubes',
      cuisine: 'Indian', diet: 'veg', timeMin: 30, effort: 3, spice: 2, kcal: 420, protein: 22, carbs: 14, fat: 30,
      moods: ['comfort', 'light'], equipment: ['stove', 'blender'], image: U('1631452180519-c014fe946bc7', 900),
      ingredients: [
        { id: 'spinach', qty: 1, unit: 'bunch' }, { id: 'paneer', qty: 200, unit: 'g' }, { id: 'onion', qty: 1, unit: 'pcs' },
        { id: 'tomato', qty: 1, unit: 'pcs' }, { id: 'garlic', qty: 4, unit: 'cloves' }, { id: 'ghee', qty: 1, unit: 'tbsp' },
        { id: 'cumin', qty: 1, unit: 'tsp' }, { id: 'garam_masala', qty: 0.5, unit: 'tsp' }, { id: 'salt', qty: 1, unit: 'tsp' },
      ],
      steps: [
        { text: 'Blanch the spinach for 2 minutes, then blend smooth with garlic.', minutes: 6 },
        { text: 'Crackle cumin in ghee, add onion and tomato and cook soft.', minutes: 8 },
        { text: 'Pour in the spinach purée with garam masala and salt. Simmer.', minutes: 6 },
        { text: 'Fold in paneer cubes and warm through.', minutes: 4 },
      ],
      swaps: [{ missing: 'Paneer', use: 'Firm tofu or boiled potato cubes.' }, { missing: 'Blender', use: 'Chop the spinach very fine - rustic but great.' }],
    }),
    R({
      id: 'egg-fried-rice', name: 'Egg Fried Rice', subtitle: 'Leftover rice, 15 minutes, one pan',
      cuisine: 'Chinese', diet: 'egg', timeMin: 15, effort: 1, spice: 1, kcal: 480, protein: 18, carbs: 62, fat: 16,
      moods: ['lazy', 'comfort'], onePan: true, image: U('1603133872878-684f208fb84b', 900),
      ingredients: [
        { id: 'rice', qty: 300, unit: 'g' }, { id: 'eggs', qty: 3, unit: 'pcs' }, { id: 'pepper', qty: 1, unit: 'pcs' },
        { id: 'onion', qty: 1, unit: 'pcs' }, { id: 'garlic', qty: 3, unit: 'cloves' }, { id: 'soy_sauce', qty: 2, unit: 'tbsp' },
        { id: 'black_pepper', qty: 0.5, unit: 'tsp' }, { id: 'olive_oil', qty: 1, unit: 'tbsp' }, { id: 'salt', qty: 0.5, unit: 'tsp' },
      ],
      steps: [
        { text: 'Scramble the eggs in hot oil, then push them to the side.', minutes: 3 },
        { text: 'Stir-fry garlic, onion and pepper on high heat.', minutes: 4 },
        { text: 'Add the rice, soy sauce and pepper. Toss until every grain is hot.', minutes: 5 },
      ],
      swaps: [{ missing: 'Soy sauce', use: 'A pinch of salt + a few drops of vinegar.' }],
    }),
    R({
      id: 'shakshuka', name: 'Shakshuka', subtitle: 'Eggs poached in spiced tomato sauce',
      cuisine: 'Middle Eastern', diet: 'egg', timeMin: 25, effort: 2, spice: 3, kcal: 390, protein: 20, carbs: 18, fat: 26,
      moods: ['comfort', 'adventurous', 'date'], onePan: true, image: U('1590412200988-a436970781fa', 900),
      ingredients: [
        { id: 'eggs', qty: 4, unit: 'pcs' }, { id: 'tomato', qty: 4, unit: 'pcs' }, { id: 'pepper', qty: 1, unit: 'pcs' },
        { id: 'onion', qty: 1, unit: 'pcs' }, { id: 'garlic', qty: 3, unit: 'cloves' }, { id: 'cumin', qty: 1, unit: 'tsp' },
        { id: 'chilli_flakes', qty: 0.5, unit: 'tsp' }, { id: 'olive_oil', qty: 2, unit: 'tbsp' }, { id: 'salt', qty: 1, unit: 'tsp' },
        { id: 'bread', qty: 4, unit: 'slices' },
      ],
      steps: [
        { text: 'Soften onion, pepper and garlic in olive oil with cumin and chilli.', minutes: 6 },
        { text: 'Add chopped tomatoes and simmer into a thick sauce.', minutes: 10 },
        { text: 'Make four wells, crack in the eggs, cover and cook until just set.', minutes: 6 },
        { text: 'Serve straight from the pan with bread for dipping.', minutes: 1 },
      ],
      swaps: [{ missing: 'Bread', use: 'Toast leftover rotis or serve over rice.' }],
    }),
    R({
      id: 'tikka-wrap', name: 'Chicken Tikka Wrap', subtitle: 'Charred tikka, tangy onions, rolled up',
      cuisine: 'Indian', diet: 'nonveg', timeMin: 30, effort: 3, spice: 4, kcal: 510, protein: 42, carbs: 40, fat: 18,
      moods: ['party', 'workout'], image: U('1626700051175-6818013e1d4f', 900),
      ingredients: [
        { id: 'chicken', qty: 300, unit: 'g' }, { id: 'yogurt', qty: 100, unit: 'g' }, { id: 'onion', qty: 1, unit: 'pcs' },
        { id: 'lemon', qty: 1, unit: 'pcs' }, { id: 'tortilla', qty: 4, unit: 'pcs' }, { id: 'garam_masala', qty: 1, unit: 'tsp' },
        { id: 'red_chilli', qty: 1, unit: 'tsp' }, { id: 'gg_paste', qty: 1, unit: 'tsp' }, { id: 'salt', qty: 1, unit: 'tsp' },
      ],
      steps: [
        { text: 'Marinate chicken strips in yogurt, spices, paste and lemon.', minutes: 10 },
        { text: 'Cook on a smoking-hot pan until charred at the edges.', minutes: 8 },
        { text: 'Toss sliced onion with lemon and salt.', minutes: 2 },
        { text: 'Warm the wraps, fill and roll tight.', minutes: 3 },
      ],
      swaps: [{ missing: 'Tortillas', use: 'Roll it in atta rotis - a 5-minute dough.' }],
    }),
    R({
      id: 'tomato-pasta', name: 'Tomato Garlic Pasta', subtitle: 'Pantry pasta with a chilli kick',
      cuisine: 'Italian', diet: 'veg', timeMin: 20, effort: 1, spice: 2, kcal: 520, protein: 16, carbs: 78, fat: 16,
      moods: ['lazy', 'comfort', 'date'], onePan: true, image: U('1621996346565-e3dbc646d9a9', 900),
      ingredients: [
        { id: 'pasta', qty: 200, unit: 'g' }, { id: 'tomato', qty: 3, unit: 'pcs' }, { id: 'garlic', qty: 5, unit: 'cloves' },
        { id: 'olive_oil', qty: 2, unit: 'tbsp' }, { id: 'chilli_flakes', qty: 0.5, unit: 'tsp' }, { id: 'oregano', qty: 1, unit: 'tsp' },
        { id: 'salt', qty: 1, unit: 'tsp' }, { id: 'cheese', qty: 30, unit: 'g' },
      ],
      steps: [
        { text: 'Boil the pasta in well-salted water.', minutes: 10 },
        { text: 'Sizzle sliced garlic and chilli in olive oil, add tomatoes and oregano.', minutes: 6 },
        { text: 'Toss in the pasta with a splash of pasta water. Top with cheese.', minutes: 2 },
      ],
      swaps: [{ missing: 'Pasta', use: 'Use rice for a tomato-garlic pulao-style bowl.' }, { missing: 'Cheese', use: 'Skip it, or stir in a spoon of yogurt.' }],
    }),
    R({
      id: 'paneer-bhurji', name: 'Paneer Bhurji', subtitle: 'Scrambled paneer, ready in 15',
      cuisine: 'Indian', diet: 'veg', timeMin: 15, effort: 1, spice: 3, kcal: 380, protein: 24, carbs: 12, fat: 26,
      moods: ['lazy', 'workout'], onePan: true, image: U('1567188040759-fb8a883dc6d8', 900),
      ingredients: [
        { id: 'paneer', qty: 200, unit: 'g' }, { id: 'onion', qty: 1, unit: 'pcs' }, { id: 'tomato', qty: 2, unit: 'pcs' },
        { id: 'pepper', qty: 1, unit: 'pcs' }, { id: 'turmeric', qty: 0.5, unit: 'tsp' }, { id: 'red_chilli', qty: 0.5, unit: 'tsp' },
        { id: 'cumin', qty: 0.5, unit: 'tsp' }, { id: 'butter', qty: 1, unit: 'tbsp' }, { id: 'salt', qty: 0.5, unit: 'tsp' },
      ],
      steps: [
        { text: 'Crackle cumin in butter, then soften onion and pepper.', minutes: 5 },
        { text: 'Add tomatoes, turmeric and chilli; cook until saucy.', minutes: 5 },
        { text: 'Crumble in the paneer and stir for two minutes.', minutes: 3 },
      ],
      swaps: [{ missing: 'Paneer', use: 'Scrambled eggs make a great egg bhurji.' }],
    }),
    R({
      id: 'lemon-chicken-bowl', name: 'Lemon Herb Chicken Bowl', subtitle: 'Oven-roasted, bright and high-protein',
      cuisine: 'Continental', diet: 'nonveg', timeMin: 40, effort: 4, spice: 1, kcal: 560, protein: 45, carbs: 50, fat: 18,
      moods: ['light', 'workout'], equipment: ['oven', 'stove'], image: U('1546069901-ba9599a7e63c', 900),
      ingredients: [
        { id: 'chicken', qty: 400, unit: 'g' }, { id: 'lemon', qty: 1, unit: 'pcs' }, { id: 'garlic', qty: 4, unit: 'cloves' },
        { id: 'rice', qty: 200, unit: 'g' }, { id: 'spinach', qty: 0.5, unit: 'bunch' }, { id: 'olive_oil', qty: 2, unit: 'tbsp' },
        { id: 'black_pepper', qty: 1, unit: 'tsp' }, { id: 'oregano', qty: 1, unit: 'tsp' }, { id: 'salt', qty: 1, unit: 'tsp' },
      ],
      steps: [
        { text: 'Rub chicken with lemon, garlic, oregano, pepper, salt and oil.', minutes: 5 },
        { text: 'Roast at 200 °C until juices run clear.', minutes: 22 },
        { text: 'Meanwhile cook the rice and wilt the spinach.', minutes: 15 },
        { text: 'Slice, pile into bowls, squeeze over more lemon.', minutes: 3 },
      ],
      swaps: [{ missing: 'Oven', use: 'Pan-sear thin fillets, 5 min per side.' }],
    }),
    R({
      id: 'masala-omelette', name: 'Masala Omelette', subtitle: 'Fluffy, spiced, 10 minutes flat',
      cuisine: 'Indian', diet: 'egg', timeMin: 10, effort: 1, spice: 2, kcal: 310, protein: 19, carbs: 6, fat: 23,
      moods: ['lazy', 'sick', 'workout'], onePan: true, image: U('1510693206972-df098062cb71', 900),
      ingredients: [
        { id: 'eggs', qty: 3, unit: 'pcs' }, { id: 'onion', qty: 0.5, unit: 'pcs' }, { id: 'tomato', qty: 1, unit: 'pcs' },
        { id: 'pepper', qty: 0.5, unit: 'pcs' }, { id: 'turmeric', qty: 0.25, unit: 'tsp' }, { id: 'red_chilli', qty: 0.25, unit: 'tsp' },
        { id: 'butter', qty: 1, unit: 'tbsp' }, { id: 'salt', qty: 0.25, unit: 'tsp' },
      ],
      steps: [
        { text: 'Whisk eggs with finely chopped onion, tomato, pepper and spices.', minutes: 3 },
        { text: 'Pour into foaming butter, cook until the edges set, fold.', minutes: 4 },
      ],
      swaps: [],
    }),
    R({
      id: 'curd-rice', name: 'Curd Rice', subtitle: 'Cooling, gentle, sick-day classic',
      cuisine: 'Indian', diet: 'veg', timeMin: 10, effort: 1, spice: 1, kcal: 350, protein: 11, carbs: 58, fat: 8,
      moods: ['sick', 'light', 'comfort'], image: U('1596797038530-2c107229654b', 900),
      ingredients: [
        { id: 'rice', qty: 250, unit: 'g' }, { id: 'yogurt', qty: 200, unit: 'g' }, { id: 'milk', qty: 50, unit: 'ml' },
        { id: 'mustard_seeds', qty: 0.5, unit: 'tsp' }, { id: 'ghee', qty: 0.5, unit: 'tbsp' }, { id: 'salt', qty: 0.5, unit: 'tsp' },
      ],
      steps: [
        { text: 'Mash warm rice with yogurt, a splash of milk and salt.', minutes: 4 },
        { text: 'Temper mustard seeds in ghee and pour over the top.', minutes: 2 },
      ],
      swaps: [{ missing: 'Yogurt', use: 'Buttermilk works - use a little more.' }],
    }),
  ];

  const moods = [
    { id: 'comfort', label: 'Comfort', icon: 'bowl' },
    { id: 'light', label: 'Light & fresh', icon: 'leaf' },
    { id: 'adventurous', label: 'Adventurous', icon: 'compass' },
    { id: 'lazy', label: 'Lazy', icon: 'sofa' },
    { id: 'date', label: 'Date night', icon: 'heart' },
    { id: 'workout', label: 'Post-workout', icon: 'dumbbell' },
    { id: 'sick', label: 'Sick day', icon: 'thermo' },
    { id: 'party', label: 'Party', icon: 'party' },
  ];
  const cuisines = ['Any', 'Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'Continental', 'Middle Eastern'];
  const diets = [
    { id: 'none', label: 'None' }, { id: 'veg', label: 'Vegetarian' }, { id: 'vegan', label: 'Vegan' },
    { id: 'egg', label: 'Eggetarian' }, { id: 'keto', label: 'Keto' }, { id: 'protein', label: 'High-protein' }, { id: 'jain', label: 'Jain' },
  ];
  const allergies = ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Eggs'];
  const equipment = [
    { id: 'stove', label: 'Stove' }, { id: 'oven', label: 'Oven' }, { id: 'microwave', label: 'Microwave' },
    { id: 'airfryer', label: 'Air fryer' }, { id: 'pressure', label: 'Pressure cooker' }, { id: 'blender', label: 'Blender' },
  ];
  const efforts = [
    { value: 'minimal', label: 'Minimal', level: 1, desc: 'One pan, few steps, barely any chopping.' },
    { value: 'moderate', label: 'Moderate', level: 3, desc: 'Some chopping and a bit of simmering.' },
    { value: 'chef', label: 'Chef mode', level: 5, desc: 'Bring it on - multi-step cooking is fine.' },
  ];
  const hunger = [{ value: 'snack', label: 'Snack' }, { value: 'meal', label: 'Meal' }, { value: 'starving', label: 'Starving' }];
  const spiceLabels = ['Mild', 'Gentle', 'Medium', 'Hot', 'Fire'];
  const sorts = [
    { value: 'best', label: 'Best match' }, { value: 'quick', label: 'Quickest' },
    { value: 'effort', label: 'Least effort' }, { value: 'protein', label: 'Highest protein' },
  ];
  const filters = [
    { value: 'all', label: 'All' }, { value: 'everything', label: 'Uses everything' },
    { value: 'quick', label: '≤ 20 min' }, { value: 'onepan', label: 'One-pan' }, { value: 'protein', label: 'High-protein' },
  ];
  const pantryCategories = ['All', 'Spices', 'Oils & Fats', 'Grains & Flours', 'Sauces', 'Baking', 'Dairy basics'];
  const user = { name: 'Alex', householdSize: 2, diet: 'none', allergies: [], units: 'metric', defaultEffort: 'moderate' };

  // Fresh detection result for n photos (a new scan resets any earlier confirmations)
  const detectedFor = (n) => detected
    .filter((d) => d.photoIndex < n)
    .map((d) => Object.assign({}, d, { value: d.aiEstimate, displayUnit: d.unit, touched: false }));

  function seedState() {
    return {
      onboarded: false,
      user: Object.assign({}, user),
      photos: [
        { id: 'ph1', src: library[0].src, label: 'Fridge' },
        { id: 'ph2', src: library[1].src, label: 'Pantry shelf', blurry: true },
        { id: 'ph3', src: library[2].src, label: 'Spice rack' },
      ],
      detected: detectedFor(3),
      confirmedAt: null,
      lastScan: { at: daysAgo(2), items: 11 },
      pantry: staples.map((s) => Object.assign({}, s)),
      autoInclude: true,
      excluded: {},
      prefs: { mood: 'comfort', time: 45, effort: 'moderate', servings: 2, hunger: 'meal', cuisines: ['Any'], diet: 'none', equipment: ['stove', 'microwave', 'pressure', 'blender'], spice: 3 },
      filter: 'all',
      sort: 'best',
      saved: ['palak-paneer', 'shakshuka'],
      cooked: ['egg-fried-rice', 'paneer-bhurji'],
      // Transient UI state - never persisted
      ui: { sheet: null, toast: null, onbStep: 0, camIdx: 3, flash: false, picker: [], found: 0, pantryOpen: true, recipeTab: 'ingredients', cookStep: 0, timer: null, used: {}, pantryCat: 'All' },
    };
  }

  return {
    library, onboarding, detected, addable, staples, stapleSuggestions, recipes, moods, cuisines, diets, allergies,
    equipment, efforts, hunger, spiceLabels, sorts, filters, pantryCategories, user, detectedFor, seedState,
  };
})();
