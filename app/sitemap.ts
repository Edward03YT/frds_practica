import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: "https://mis-summer.vercel.app/",
      lastModified: new Date(),
    },
    {
      url: "https://mis-summer.vercel.app/home",
      lastModified: new Date(),
    },
    {
      url: "https://mis-summer.vercel.app/about",
      lastModified: new Date(),
    },
    {
      url: "https://mis-summer.vercel.app/contact",
      lastModified: new Date(),
    },
    
  ];
}