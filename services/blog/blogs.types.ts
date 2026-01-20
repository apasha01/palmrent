/* eslint-disable @typescript-eslint/no-explicit-any */

export type BlogItem = {
  id: number;
  title: string;
  text: string;
  branch: string;
  photo: string | null;
};

export type BlogsResponse = {
  items: BlogItem[];
};
