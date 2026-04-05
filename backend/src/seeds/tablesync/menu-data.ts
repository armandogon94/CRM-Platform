import { Item, ColumnValue } from '../../models';
import { TableSyncContext } from './workspace';
import { BoardContext } from './boards';

interface MenuRecord {
  dishName: string;
  category: string;
  price: number;
  available: boolean;
  ingredients: string;
}

// ─── Appetizers (18) ─────────────────────────────────────────────────
const APPETIZERS: MenuRecord[] = [
  { dishName: 'Burrata Caprese', category: 'appetizers', price: 16, available: true, ingredients: 'Fresh burrata, heirloom tomatoes, basil, aged balsamic reduction, extra virgin olive oil' },
  { dishName: 'Tuna Tartare', category: 'appetizers', price: 19, available: true, ingredients: 'Sushi-grade ahi tuna, avocado, sesame oil, soy reduction, crispy wonton chips' },
  { dishName: 'French Onion Soup', category: 'appetizers', price: 14, available: true, ingredients: 'Caramelized onions, beef bone broth, Gruyere cheese, toasted baguette crouton' },
  { dishName: 'Crispy Calamari', category: 'appetizers', price: 15, available: true, ingredients: 'Lightly battered calamari rings, cherry peppers, lemon aioli, marinara dipping sauce' },
  { dishName: 'Beef Carpaccio', category: 'appetizers', price: 18, available: true, ingredients: 'Thinly sliced raw tenderloin, arugula, shaved Parmesan, capers, truffle oil' },
  { dishName: 'Lobster Bisque', category: 'appetizers', price: 17, available: true, ingredients: 'Maine lobster, cream, sherry, tarragon, lobster claw garnish' },
  { dishName: 'Shrimp Cocktail', category: 'appetizers', price: 18, available: true, ingredients: 'Jumbo poached shrimp, house-made cocktail sauce, fresh horseradish, lemon wedge' },
  { dishName: 'Charcuterie Board', category: 'appetizers', price: 24, available: true, ingredients: 'Prosciutto di Parma, sopressata, aged cheddar, Manchego, cornichons, fig jam, grilled bread' },
  { dishName: 'Caesar Salad', category: 'appetizers', price: 13, available: true, ingredients: 'Romaine hearts, house Caesar dressing, Parmigiano-Reggiano, anchovy croutons' },
  { dishName: 'Beet & Goat Cheese Salad', category: 'appetizers', price: 14, available: true, ingredients: 'Roasted golden and red beets, whipped goat cheese, candied walnuts, honey vinaigrette' },
  { dishName: 'Mushroom Arancini', category: 'appetizers', price: 14, available: true, ingredients: 'Crispy risotto balls, wild mushroom ragout, fontina cheese, truffle aioli' },
  { dishName: 'Ahi Poke Bowl', category: 'appetizers', price: 17, available: true, ingredients: 'Diced ahi tuna, cucumber, edamame, pickled ginger, spicy mayo, sesame seeds' },
  { dishName: 'Bruschetta Trio', category: 'appetizers', price: 13, available: true, ingredients: 'Tomato-basil, wild mushroom, and roasted red pepper on grilled ciabatta' },
  { dishName: 'Crab Cakes', category: 'appetizers', price: 20, available: true, ingredients: 'Jumbo lump crab, Old Bay, remoulade sauce, micro greens, lemon' },
  { dishName: 'Stuffed Medjool Dates', category: 'appetizers', price: 12, available: true, ingredients: 'Bacon-wrapped dates, blue cheese filling, balsamic glaze' },
  { dishName: 'Roasted Bone Marrow', category: 'appetizers', price: 16, available: false, ingredients: 'Split bone marrow, herb gremolata, sea salt, grilled sourdough' },
  { dishName: 'Oysters on the Half Shell', category: 'appetizers', price: 22, available: true, ingredients: 'Half dozen East Coast oysters, mignonette, cocktail sauce, lemon' },
  { dishName: 'Spring Rolls', category: 'appetizers', price: 12, available: true, ingredients: 'Crispy vegetable spring rolls, sweet chili dipping sauce, pickled daikon' },
];

// ─── Entrees (24) ────────────────────────────────────────────────────
const ENTREES: MenuRecord[] = [
  { dishName: 'Filet Mignon', category: 'entrees', price: 52, available: true, ingredients: '8oz center-cut filet, truffle butter, roasted fingerling potatoes, asparagus, red wine demi-glace' },
  { dishName: 'Pan-Seared Salmon', category: 'entrees', price: 36, available: true, ingredients: 'Atlantic salmon, lemon dill beurre blanc, wild rice pilaf, haricots verts' },
  { dishName: 'Lobster Ravioli', category: 'entrees', price: 38, available: true, ingredients: 'Handmade pasta, Maine lobster filling, saffron cream sauce, chives' },
  { dishName: 'Grilled Ribeye', category: 'entrees', price: 48, available: true, ingredients: '14oz bone-in ribeye, herb compound butter, garlic mashed potatoes, grilled broccolini' },
  { dishName: 'Chicken Marsala', category: 'entrees', price: 28, available: true, ingredients: 'Pan-seared chicken breast, Marsala wine sauce, cremini mushrooms, angel hair pasta' },
  { dishName: 'Seafood Risotto', category: 'entrees', price: 34, available: true, ingredients: 'Arborio rice, shrimp, scallops, mussels, white wine, saffron, Parmesan' },
  { dishName: 'Braised Short Ribs', category: 'entrees', price: 38, available: true, ingredients: 'Slow-braised boneless short ribs, celery root puree, roasted root vegetables, port reduction' },
  { dishName: 'Rack of Lamb', category: 'entrees', price: 46, available: true, ingredients: 'New Zealand lamb, herb crust, mint chimichurri, roasted baby potatoes, grilled zucchini' },
  { dishName: 'Seared Duck Breast', category: 'entrees', price: 40, available: true, ingredients: 'Muscovy duck breast, cherry gastrique, sweet potato gratin, sauteed spinach' },
  { dishName: 'Mushroom Risotto', category: 'entrees', price: 26, available: true, ingredients: 'Arborio rice, porcini and chanterelle mushrooms, Parmesan, truffle oil, thyme' },
  { dishName: 'Pappardelle Bolognese', category: 'entrees', price: 24, available: true, ingredients: 'Fresh pappardelle pasta, slow-simmered beef and pork ragu, Pecorino Romano' },
  { dishName: 'Grilled Swordfish', category: 'entrees', price: 38, available: true, ingredients: 'Swordfish steak, olive tapenade, roasted tomatoes, capers, orzo salad' },
  { dishName: 'Veal Piccata', category: 'entrees', price: 34, available: true, ingredients: 'Tender veal cutlets, lemon caper butter sauce, angel hair pasta, Italian parsley' },
  { dishName: 'Chilean Sea Bass', category: 'entrees', price: 44, available: true, ingredients: 'Miso-glazed sea bass, baby bok choy, sticky rice, ginger scallion sauce' },
  { dishName: 'Eggplant Parmesan', category: 'entrees', price: 22, available: true, ingredients: 'Breaded eggplant, San Marzano marinara, mozzarella, basil, spaghetti' },
  { dishName: 'Herb-Roasted Chicken', category: 'entrees', price: 28, available: true, ingredients: 'Half roasted free-range chicken, lemon herb jus, roasted garlic mashed, seasonal vegetables' },
  { dishName: 'Grilled Pork Chop', category: 'entrees', price: 32, available: true, ingredients: '12oz bone-in Berkshire pork chop, apple mostarda, sweet potato puree, braised greens' },
  { dishName: 'Cioppino', category: 'entrees', price: 36, available: true, ingredients: 'Dungeness crab, clams, mussels, shrimp, white fish, tomato saffron broth, grilled bread' },
  { dishName: 'New York Strip', category: 'entrees', price: 46, available: true, ingredients: '12oz dry-aged strip steak, peppercorn sauce, crispy onion rings, loaded baked potato' },
  { dishName: 'Truffle Mac & Cheese', category: 'entrees', price: 22, available: true, ingredients: 'Cavatappi pasta, three-cheese sauce, black truffle, panko breadcrumb crust' },
  { dishName: 'Osso Buco', category: 'entrees', price: 42, available: false, ingredients: 'Braised veal shank, gremolata, saffron risotto Milanese, roasted tomatoes' },
  { dishName: 'Wild Mushroom Tagliatelle', category: 'entrees', price: 26, available: true, ingredients: 'Fresh tagliatelle, wild mushroom medley, cream, thyme, shaved Parmesan' },
  { dishName: 'Pan-Roasted Halibut', category: 'entrees', price: 40, available: true, ingredients: 'Pacific halibut, brown butter, crushed fingerlings, blistered tomatoes, basil oil' },
  { dishName: 'Lamb Shank', category: 'entrees', price: 36, available: true, ingredients: 'Slow-braised lamb shank, creamy polenta, roasted carrots, rosemary jus' },
];

// ─── Desserts (14) ───────────────────────────────────────────────────
const DESSERTS: MenuRecord[] = [
  { dishName: 'Tiramisu', category: 'desserts', price: 14, available: true, ingredients: 'Espresso-soaked ladyfingers, mascarpone cream, cocoa powder, chocolate shavings' },
  { dishName: 'Creme Brulee', category: 'desserts', price: 13, available: true, ingredients: 'Classic vanilla bean custard, caramelized sugar crust, fresh berries' },
  { dishName: 'Chocolate Lava Cake', category: 'desserts', price: 15, available: true, ingredients: 'Warm Valrhona chocolate fondant, vanilla bean ice cream, raspberry coulis' },
  { dishName: 'New York Cheesecake', category: 'desserts', price: 13, available: true, ingredients: 'Classic baked cheesecake, graham cracker crust, strawberry compote, whipped cream' },
  { dishName: 'Panna Cotta', category: 'desserts', price: 12, available: true, ingredients: 'Italian cream custard, mixed berry compote, fresh mint' },
  { dishName: 'Apple Tarte Tatin', category: 'desserts', price: 14, available: true, ingredients: 'Caramelized apple tart, puff pastry, cinnamon ice cream, caramel drizzle' },
  { dishName: 'Affogato', category: 'desserts', price: 10, available: true, ingredients: 'Double espresso poured over vanilla gelato, amaretti cookie' },
  { dishName: 'Lemon Sorbet Trio', category: 'desserts', price: 11, available: true, ingredients: 'Lemon, blood orange, and passion fruit sorbets, tuile cookie' },
  { dishName: 'Cannoli', category: 'desserts', price: 12, available: true, ingredients: 'Crispy Sicilian pastry shells, sweet ricotta filling, pistachios, chocolate chips' },
  { dishName: 'Bread Pudding', category: 'desserts', price: 13, available: true, ingredients: 'Brioche bread pudding, bourbon caramel sauce, whipped cream, candied pecans' },
  { dishName: 'Flourless Chocolate Torte', category: 'desserts', price: 14, available: true, ingredients: 'Dense chocolate torte (gluten-free), whipped cream, fresh strawberries, gold leaf' },
  { dishName: 'Seasonal Fruit Crumble', category: 'desserts', price: 12, available: true, ingredients: 'Seasonal stone fruits, oat crumble topping, vanilla ice cream' },
  { dishName: 'Profiteroles', category: 'desserts', price: 13, available: true, ingredients: 'Choux pastry puffs, vanilla custard, warm chocolate ganache, powdered sugar' },
  { dishName: 'Gelato Flight', category: 'desserts', price: 11, available: true, ingredients: 'Choice of four: pistachio, stracciatella, hazelnut, dark chocolate, mango' },
];

// ─── Beverages (14) ──────────────────────────────────────────────────
const BEVERAGES: MenuRecord[] = [
  { dishName: 'Classic Old Fashioned', category: 'beverages', price: 16, available: true, ingredients: 'Bourbon, Angostura bitters, sugar cube, orange peel, Luxardo cherry' },
  { dishName: 'Espresso Martini', category: 'beverages', price: 17, available: true, ingredients: 'Vodka, Kahlua, fresh espresso, vanilla syrup, coffee beans' },
  { dishName: 'Negroni', category: 'beverages', price: 15, available: true, ingredients: 'Gin, Campari, sweet vermouth, orange peel' },
  { dishName: 'Aperol Spritz', category: 'beverages', price: 14, available: true, ingredients: 'Aperol, Prosecco, soda water, orange slice' },
  { dishName: 'House Red Blend (Glass)', category: 'beverages', price: 14, available: true, ingredients: 'Proprietary blend — Cabernet Sauvignon, Merlot, Malbec, Napa Valley' },
  { dishName: 'House White (Glass)', category: 'beverages', price: 13, available: true, ingredients: 'Chardonnay, Sonoma Coast, notes of green apple and vanilla' },
  { dishName: 'Pinot Noir (Glass)', category: 'beverages', price: 16, available: true, ingredients: 'Willamette Valley, Oregon — cherry, earth, subtle spice' },
  { dishName: 'Champagne (Glass)', category: 'beverages', price: 22, available: true, ingredients: 'Moet & Chandon Imperial Brut, Epernay, France' },
  { dishName: 'Craft Beer Flight', category: 'beverages', price: 14, available: true, ingredients: 'Four 5oz pours from rotating local craft selection' },
  { dishName: 'Fresh Lemonade', category: 'beverages', price: 6, available: true, ingredients: 'House-squeezed lemons, simple syrup, sparkling or still water, mint' },
  { dishName: 'Italian Soda', category: 'beverages', price: 5, available: true, ingredients: 'Flavored Torani syrup (choice of 6 flavors), sparkling water, cream float' },
  { dishName: 'Ginger Mule (Non-Alcoholic)', category: 'beverages', price: 8, available: true, ingredients: 'Fresh ginger, lime juice, ginger beer, mint garnish' },
  { dishName: 'Hot Toddy', category: 'beverages', price: 14, available: false, ingredients: 'Bourbon, honey, lemon, clove-studded orange, cinnamon stick' },
  { dishName: 'Sommelier\'s Choice Wine Pairing', category: 'beverages', price: 45, available: true, ingredients: '4-glass pairing selected to complement your meal — changes nightly' },
];

const ALL_MENU_ITEMS = [...APPETIZERS, ...ENTREES, ...DESSERTS, ...BEVERAGES];

const CATEGORY_TO_GROUP: Record<string, string> = {
  appetizers: 'Appetizers',
  entrees: 'Entrees',
  desserts: 'Desserts',
  beverages: 'Beverages',
};

export async function seedMenu(
  ctx: TableSyncContext,
  board: BoardContext
): Promise<void> {
  console.log(`[TableSync] Seeding ${ALL_MENU_ITEMS.length} menu items...`);

  for (let i = 0; i < ALL_MENU_ITEMS.length; i++) {
    const m = ALL_MENU_ITEMS[i];
    const groupName = CATEGORY_TO_GROUP[m.category] || 'Appetizers';
    const groupId = board.groups[groupName];

    const item = await Item.create({
      boardId: board.boardId,
      groupId,
      name: m.dishName,
      position: i,
      createdBy: ctx.headChefId,
    });

    const values = [
      { itemId: item.id, columnId: board.columns['Dish Name'], value: m.dishName },
      { itemId: item.id, columnId: board.columns['Category'], value: m.category },
      { itemId: item.id, columnId: board.columns['Price'], value: m.price },
      { itemId: item.id, columnId: board.columns['Available'], value: m.available },
      { itemId: item.id, columnId: board.columns['Ingredients'], value: m.ingredients },
    ];

    await ColumnValue.bulkCreate(values);
  }

  console.log(`[TableSync] Seeded ${ALL_MENU_ITEMS.length} menu items across ${Object.keys(board.groups).length} categories`);
}

export { ALL_MENU_ITEMS };
