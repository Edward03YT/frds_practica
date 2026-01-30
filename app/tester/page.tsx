

'use client';

import React from 'react';

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

async function getData(): Promise<Post> {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

export default function TestPage() {
  const [data, setData] = React.useState<Post | null>(null);

  React.useEffect(() => {
    getData().then(setData).catch(console.error);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1>Date de la API:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
