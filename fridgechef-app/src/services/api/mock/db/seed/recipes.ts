/**
 * Mock backend seed: the 10 recipes (`GET /v1/recipes/{id}`, `POST /v1/recipes/suggest`).
 * Ported from fridgechef-mockup/js/data.js with values unchanged, and typed as contract DTOs so
 * a shape mismatch fails `tsc`. Copy follows the content rules (checked by content-rules.test.ts).
 */
import type { RecipeDto } from '../../../contract';

export const recipeSeed: RecipeDto[] = [
  {
    id: 'butter-chicken',
    name: 'Butter Chicken Lite',
    subtitle: 'Creamy tomato gravy, easy on the butter',
    cuisine: 'Indian',
    diet: 'nonveg',
    timeMin: 35,
    effort: 3,
    spice: 3,
    servings: 2,
    nutrition: {
      kcal: 540,
      protein: 38,
      carbs: 22,
      fat: 30,
    },
    moods: ['comfort', 'date'],
    equipment: ['stove'],
    onePan: false,
    imageUrl:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'chicken',
        name: 'Chicken breast',
        qty: 400,
        unit: 'g',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 3,
        unit: 'pcs',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'yogurt',
        name: 'Yogurt',
        qty: 100,
        unit: 'g',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 4,
        unit: 'cloves',
      },
      {
        id: 'cream',
        name: 'Fresh cream',
        qty: 50,
        unit: 'ml',
      },
      {
        id: 'butter',
        name: 'Butter',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'garam_masala',
        name: 'Garam masala',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'red_chilli',
        name: 'Red chilli powder',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'gg_paste',
        name: 'Ginger-garlic paste',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Toss the chicken with yogurt, chilli, ginger-garlic paste and salt. Rest while you prep.',
        minutes: 10,
      },
      {
        text: 'Sear the chicken in half the butter until golden. Set aside.',
        minutes: 6,
      },
      {
        text: 'Cook onion, garlic and tomatoes down to a thick, jammy purée.',
        minutes: 10,
      },
      {
        text: 'Stir in garam masala, return the chicken, add cream and simmer.',
        minutes: 8,
      },
      {
        text: 'Finish with the rest of the butter. Serve with rice or roti.',
        minutes: 1,
      },
    ],
    swaps: [
      {
        missing: 'Fresh cream',
        use: 'Whisk 2 tbsp yogurt with 1 tsp butter - stir in off the heat.',
      },
      {
        missing: 'Butter',
        use: 'Ghee works 1:1 and tastes even richer.',
      },
    ],
  },
  {
    id: 'palak-paneer',
    name: 'Palak Paneer',
    subtitle: 'Silky spinach, soft paneer cubes',
    cuisine: 'Indian',
    diet: 'veg',
    timeMin: 30,
    effort: 3,
    spice: 2,
    servings: 2,
    nutrition: {
      kcal: 420,
      protein: 22,
      carbs: 14,
      fat: 30,
    },
    moods: ['comfort', 'light'],
    equipment: ['stove', 'blender'],
    onePan: false,
    imageUrl:
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'spinach',
        name: 'Spinach',
        qty: 1,
        unit: 'bunch',
      },
      {
        id: 'paneer',
        name: 'Paneer',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 4,
        unit: 'cloves',
      },
      {
        id: 'ghee',
        name: 'Ghee',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'cumin',
        name: 'Cumin seeds',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'garam_masala',
        name: 'Garam masala',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Blanch the spinach for 2 minutes, then blend smooth with garlic.',
        minutes: 6,
      },
      {
        text: 'Crackle cumin in ghee, add onion and tomato and cook soft.',
        minutes: 8,
      },
      {
        text: 'Pour in the spinach purée with garam masala and salt. Simmer.',
        minutes: 6,
      },
      {
        text: 'Fold in paneer cubes and warm through.',
        minutes: 4,
      },
    ],
    swaps: [
      {
        missing: 'Paneer',
        use: 'Firm tofu or boiled potato cubes.',
      },
      {
        missing: 'Blender',
        use: 'Chop the spinach very fine - rustic but great.',
      },
    ],
  },
  {
    id: 'egg-fried-rice',
    name: 'Egg Fried Rice',
    subtitle: 'Leftover rice, 15 minutes, one pan',
    cuisine: 'Chinese',
    diet: 'egg',
    timeMin: 15,
    effort: 1,
    spice: 1,
    servings: 2,
    nutrition: {
      kcal: 480,
      protein: 18,
      carbs: 62,
      fat: 16,
    },
    moods: ['lazy', 'comfort'],
    equipment: ['stove'],
    onePan: true,
    imageUrl:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'rice',
        name: 'Rice',
        qty: 300,
        unit: 'g',
      },
      {
        id: 'eggs',
        name: 'Eggs',
        qty: 3,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 3,
        unit: 'cloves',
      },
      {
        id: 'soy_sauce',
        name: 'Soy sauce',
        qty: 2,
        unit: 'tbsp',
      },
      {
        id: 'black_pepper',
        name: 'Black pepper',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'olive_oil',
        name: 'Olive oil',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 0.5,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Scramble the eggs in hot oil, then push them to the side.',
        minutes: 3,
      },
      {
        text: 'Stir-fry garlic, onion and pepper on high heat.',
        minutes: 4,
      },
      {
        text: 'Add the rice, soy sauce and pepper. Toss until every grain is hot.',
        minutes: 5,
      },
    ],
    swaps: [
      {
        missing: 'Soy sauce',
        use: 'A pinch of salt + a few drops of vinegar.',
      },
    ],
  },
  {
    id: 'shakshuka',
    name: 'Shakshuka',
    subtitle: 'Eggs poached in spiced tomato sauce',
    cuisine: 'Middle Eastern',
    diet: 'egg',
    timeMin: 25,
    effort: 2,
    spice: 3,
    servings: 2,
    nutrition: {
      kcal: 390,
      protein: 20,
      carbs: 18,
      fat: 26,
    },
    moods: ['comfort', 'adventurous', 'date'],
    equipment: ['stove'],
    onePan: true,
    imageUrl:
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'eggs',
        name: 'Eggs',
        qty: 4,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 4,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 3,
        unit: 'cloves',
      },
      {
        id: 'cumin',
        name: 'Cumin seeds',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'chilli_flakes',
        name: 'Chilli flakes',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'olive_oil',
        name: 'Olive oil',
        qty: 2,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'bread',
        name: 'Bread',
        qty: 4,
        unit: 'slices',
      },
    ],
    steps: [
      {
        text: 'Soften onion, pepper and garlic in olive oil with cumin and chilli.',
        minutes: 6,
      },
      {
        text: 'Add chopped tomatoes and simmer into a thick sauce.',
        minutes: 10,
      },
      {
        text: 'Make four wells, crack in the eggs, cover and cook until just set.',
        minutes: 6,
      },
      {
        text: 'Serve straight from the pan with bread for dipping.',
        minutes: 1,
      },
    ],
    swaps: [
      {
        missing: 'Bread',
        use: 'Toast leftover rotis or serve over rice.',
      },
    ],
  },
  {
    id: 'tikka-wrap',
    name: 'Chicken Tikka Wrap',
    subtitle: 'Charred tikka, tangy onions, rolled up',
    cuisine: 'Indian',
    diet: 'nonveg',
    timeMin: 30,
    effort: 3,
    spice: 4,
    servings: 2,
    nutrition: {
      kcal: 510,
      protein: 42,
      carbs: 40,
      fat: 18,
    },
    moods: ['party', 'workout'],
    equipment: ['stove'],
    onePan: false,
    imageUrl:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'chicken',
        name: 'Chicken breast',
        qty: 300,
        unit: 'g',
      },
      {
        id: 'yogurt',
        name: 'Yogurt',
        qty: 100,
        unit: 'g',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'lemon',
        name: 'Lemon',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'tortilla',
        name: 'Tortillas',
        qty: 4,
        unit: 'pcs',
      },
      {
        id: 'garam_masala',
        name: 'Garam masala',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'red_chilli',
        name: 'Red chilli powder',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'gg_paste',
        name: 'Ginger-garlic paste',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Marinate chicken strips in yogurt, spices, paste and lemon.',
        minutes: 10,
      },
      {
        text: 'Cook on a smoking-hot pan until charred at the edges.',
        minutes: 8,
      },
      {
        text: 'Toss sliced onion with lemon and salt.',
        minutes: 2,
      },
      {
        text: 'Warm the wraps, fill and roll tight.',
        minutes: 3,
      },
    ],
    swaps: [
      {
        missing: 'Tortillas',
        use: 'Roll it in atta rotis - a 5-minute dough.',
      },
    ],
  },
  {
    id: 'tomato-pasta',
    name: 'Tomato Garlic Pasta',
    subtitle: 'Pantry pasta with a chilli kick',
    cuisine: 'Italian',
    diet: 'veg',
    timeMin: 20,
    effort: 1,
    spice: 2,
    servings: 2,
    nutrition: {
      kcal: 520,
      protein: 16,
      carbs: 78,
      fat: 16,
    },
    moods: ['lazy', 'comfort', 'date'],
    equipment: ['stove'],
    onePan: true,
    imageUrl:
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'pasta',
        name: 'Pasta',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 3,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 5,
        unit: 'cloves',
      },
      {
        id: 'olive_oil',
        name: 'Olive oil',
        qty: 2,
        unit: 'tbsp',
      },
      {
        id: 'chilli_flakes',
        name: 'Chilli flakes',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'oregano',
        name: 'Oregano',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'cheese',
        name: 'Cheese',
        qty: 30,
        unit: 'g',
      },
    ],
    steps: [
      {
        text: 'Boil the pasta in well-salted water.',
        minutes: 10,
      },
      {
        text: 'Sizzle sliced garlic and chilli in olive oil, add tomatoes and oregano.',
        minutes: 6,
      },
      {
        text: 'Toss in the pasta with a splash of pasta water. Top with cheese.',
        minutes: 2,
      },
    ],
    swaps: [
      {
        missing: 'Pasta',
        use: 'Use rice for a tomato-garlic pulao-style bowl.',
      },
      {
        missing: 'Cheese',
        use: 'Skip it, or stir in a spoon of yogurt.',
      },
    ],
  },
  {
    id: 'paneer-bhurji',
    name: 'Paneer Bhurji',
    subtitle: 'Scrambled paneer, ready in 15',
    cuisine: 'Indian',
    diet: 'veg',
    timeMin: 15,
    effort: 1,
    spice: 3,
    servings: 2,
    nutrition: {
      kcal: 380,
      protein: 24,
      carbs: 12,
      fat: 26,
    },
    moods: ['lazy', 'workout'],
    equipment: ['stove'],
    onePan: true,
    imageUrl:
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'paneer',
        name: 'Paneer',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 2,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'turmeric',
        name: 'Turmeric',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'red_chilli',
        name: 'Red chilli powder',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'cumin',
        name: 'Cumin seeds',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'butter',
        name: 'Butter',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 0.5,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Crackle cumin in butter, then soften onion and pepper.',
        minutes: 5,
      },
      {
        text: 'Add tomatoes, turmeric and chilli; cook until saucy.',
        minutes: 5,
      },
      {
        text: 'Crumble in the paneer and stir for two minutes.',
        minutes: 3,
      },
    ],
    swaps: [
      {
        missing: 'Paneer',
        use: 'Scrambled eggs make a great egg bhurji.',
      },
    ],
  },
  {
    id: 'lemon-chicken-bowl',
    name: 'Lemon Herb Chicken Bowl',
    subtitle: 'Oven-roasted, bright and high-protein',
    cuisine: 'Continental',
    diet: 'nonveg',
    timeMin: 40,
    effort: 4,
    spice: 1,
    servings: 2,
    nutrition: {
      kcal: 560,
      protein: 45,
      carbs: 50,
      fat: 18,
    },
    moods: ['light', 'workout'],
    equipment: ['oven', 'stove'],
    onePan: false,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'chicken',
        name: 'Chicken breast',
        qty: 400,
        unit: 'g',
      },
      {
        id: 'lemon',
        name: 'Lemon',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'garlic',
        name: 'Garlic',
        qty: 4,
        unit: 'cloves',
      },
      {
        id: 'rice',
        name: 'Rice',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'spinach',
        name: 'Spinach',
        qty: 0.5,
        unit: 'bunch',
      },
      {
        id: 'olive_oil',
        name: 'Olive oil',
        qty: 2,
        unit: 'tbsp',
      },
      {
        id: 'black_pepper',
        name: 'Black pepper',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'oregano',
        name: 'Oregano',
        qty: 1,
        unit: 'tsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 1,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Rub chicken with lemon, garlic, oregano, pepper, salt and oil.',
        minutes: 5,
      },
      {
        text: 'Roast at 200 °C until juices run clear.',
        minutes: 22,
      },
      {
        text: 'Meanwhile cook the rice and wilt the spinach.',
        minutes: 15,
      },
      {
        text: 'Slice, pile into bowls, squeeze over more lemon.',
        minutes: 3,
      },
    ],
    swaps: [
      {
        missing: 'Oven',
        use: 'Pan-sear thin fillets, 5 min per side.',
      },
    ],
  },
  {
    id: 'masala-omelette',
    name: 'Masala Omelette',
    subtitle: 'Fluffy, spiced, 10 minutes flat',
    cuisine: 'Indian',
    diet: 'egg',
    timeMin: 10,
    effort: 1,
    spice: 2,
    servings: 2,
    nutrition: {
      kcal: 310,
      protein: 19,
      carbs: 6,
      fat: 23,
    },
    moods: ['lazy', 'sick', 'workout'],
    equipment: ['stove'],
    onePan: true,
    imageUrl:
      'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'eggs',
        name: 'Eggs',
        qty: 3,
        unit: 'pcs',
      },
      {
        id: 'onion',
        name: 'Onion',
        qty: 0.5,
        unit: 'pcs',
      },
      {
        id: 'tomato',
        name: 'Tomatoes',
        qty: 1,
        unit: 'pcs',
      },
      {
        id: 'pepper',
        name: 'Bell pepper',
        qty: 0.5,
        unit: 'pcs',
      },
      {
        id: 'turmeric',
        name: 'Turmeric',
        qty: 0.25,
        unit: 'tsp',
      },
      {
        id: 'red_chilli',
        name: 'Red chilli powder',
        qty: 0.25,
        unit: 'tsp',
      },
      {
        id: 'butter',
        name: 'Butter',
        qty: 1,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 0.25,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Whisk eggs with finely chopped onion, tomato, pepper and spices.',
        minutes: 3,
      },
      {
        text: 'Pour into foaming butter, cook until the edges set, fold.',
        minutes: 4,
      },
    ],
    swaps: [],
  },
  {
    id: 'curd-rice',
    name: 'Curd Rice',
    subtitle: 'Cooling, gentle, sick-day classic',
    cuisine: 'Indian',
    diet: 'veg',
    timeMin: 10,
    effort: 1,
    spice: 1,
    servings: 2,
    nutrition: {
      kcal: 350,
      protein: 11,
      carbs: 58,
      fat: 8,
    },
    moods: ['sick', 'light', 'comfort'],
    equipment: ['stove'],
    onePan: false,
    imageUrl:
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=70',
    ingredients: [
      {
        id: 'rice',
        name: 'Rice',
        qty: 250,
        unit: 'g',
      },
      {
        id: 'yogurt',
        name: 'Yogurt',
        qty: 200,
        unit: 'g',
      },
      {
        id: 'milk',
        name: 'Milk',
        qty: 50,
        unit: 'ml',
      },
      {
        id: 'mustard_seeds',
        name: 'Mustard seeds',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        id: 'ghee',
        name: 'Ghee',
        qty: 0.5,
        unit: 'tbsp',
      },
      {
        id: 'salt',
        name: 'Salt',
        qty: 0.5,
        unit: 'tsp',
      },
    ],
    steps: [
      {
        text: 'Mash warm rice with yogurt, a splash of milk and salt.',
        minutes: 4,
      },
      {
        text: 'Temper mustard seeds in ghee and pour over the top.',
        minutes: 2,
      },
    ],
    swaps: [
      {
        missing: 'Yogurt',
        use: 'Buttermilk works - use a little more.',
      },
    ],
  },
];
