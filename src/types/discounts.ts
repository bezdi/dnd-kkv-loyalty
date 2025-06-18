export type CategoryId = "1" | "2" | "3" | "4" | "5" | "6";

export type Category = {
  desc: string;
  color: string;
  borderColor: string;
};

export type CategoryMap = Record<CategoryId, Category>;
