import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://primecasttv.vercel.app';

  // Fetch all blogs to include in sitemap
  let blogEntries: any[] = [];
  try {
    const blogsCol = collection(db, 'blogs');
    const blogSnapshot = await getDocs(blogsCol);
    blogEntries = blogSnapshot.docs.map((doc) => ({
      url: `${baseUrl}/blog/${doc.data().slug}`,
      lastModified: doc.data().updatedAt?.toDate() || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...blogEntries,
  ];
}
