export type Tab = 'Girls' | 'Guys' | 'Sale' | "" | "Home";
export type Modal = 'Search' | 'Profile' | 'SignIn' | 'Bag' | ''

export interface Item {
  id: number;
  type: string;
  name: string;
  image: string;
  price: number;
  discountedPrice: number;
  dateEntered: string;
  stock: number;
}

export interface User {
  firstName: string;
  lastName: string;
  id: string;
  password: string;
  bag?: BagItem[];
}


export type BagItem = {
  id: number,
  quantity: number
}

export type State = {
  store: Item[],
  tab: Tab,
  modal: Modal | null,
  search: string,
  user: User | null,
  selectedItem: Item | null,
  bag: BagItem[]
}
