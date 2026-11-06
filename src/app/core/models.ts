export type Currency = 'USD' | 'UYU';
export interface Category { id: number; name: string; description: string; productCount: number | string; imgSrc: string; }
export interface ProductSummary { id: number; name: string; description: string; cost: number; currency: Currency; soldCount: number; image: string; }
export interface Related { id: number; name: string; image: string; }
export interface Product extends Omit<ProductSummary, 'image'> { category: string; images: string[]; relatedProducts: Related[]; }
export interface Comment { product: number; score: number; description: string; user: string; dateTime: string; }
export interface CartItem { id: number; name: string; unitCost: number; currency: Currency; image: string; count: number; }
