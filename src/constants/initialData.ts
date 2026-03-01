export const INITIAL_MENU = [
  {
    id: 1,
    name: "Drinks",
    icon: "GlassWater",
    order: 0,
    items: [
      {
        id: 1,
        category_id: 1,
        name: "Caipirinha",
        description: "Limão, açúcar, gelo e cachaça",
        image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop",
        icon: "GlassWater",
        prices: [{ label: "Dose", price: 15.00 }, { label: "Copo", price: 22.00 }],
        order: 0
      },
      {
        id: 2,
        category_id: 1,
        name: "Gin Tônica",
        description: "Gin, tônica, limão e alecrim",
        image_url: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=800&auto=format&fit=crop",
        icon: "GlassWater",
        prices: [{ label: "Copo", price: 28.00 }],
        order: 1
      }
    ]
  },
  {
    id: 2,
    name: "Cervejas",
    icon: "Beer",
    order: 1,
    items: [
      {
        id: 3,
        category_id: 2,
        name: "Heineken",
        description: "Long Neck 330ml",
        image_url: "https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=800&auto=format&fit=crop",
        icon: "Beer",
        prices: [{ label: "Unidade", price: 12.00 }],
        order: 0
      },
      {
        id: 4,
        category_id: 2,
        name: "Brahma",
        description: "Lata 350ml",
        image_url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=800&auto=format&fit=crop",
        icon: "Beer",
        prices: [{ label: "Unidade", price: 6.00 }],
        order: 1
      }
    ]
  },
  {
    id: 3,
    name: "Petiscos",
    icon: "Utensils",
    order: 2,
    items: [
      {
        id: 5,
        category_id: 3,
        name: "Batata Frita",
        description: "Porção generosa com queijo e bacon",
        image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop",
        icon: "Utensils",
        prices: [{ label: "Meia", price: 25.00 }, { label: "Inteira", price: 45.00 }],
        order: 0
      }
    ]
  }
];
