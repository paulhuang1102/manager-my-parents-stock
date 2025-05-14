export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface StockAccount {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  accountId: string;
  userId: string;
  isMarked: boolean;
  addedAt: number;
}
