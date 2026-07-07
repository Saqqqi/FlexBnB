import React, { useEffect, useState } from 'react';

const ListingsPage = () => {
  const [listings, setListings] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/host/listings')
      .then(res => res.json())
      .then(data => setListings(data.listings));
  }, []);

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Your Listings</h2>
      <table className="w-full border rounded-xl">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Price/Night</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing: any) => (
            <tr key={listing.id} className="border-b">
              <td className="p-2">{listing.title}</td>
              <td className="p-2">${listing.price_per_night}</td>
              <td className="p-2">{listing.status}</td>
              <td className="p-2 flex gap-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded">Edit</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default ListingsPage; 