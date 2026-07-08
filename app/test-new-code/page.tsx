'use client';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">TEST PAGE - NEW CODE VERSION</h1>
      <p className="mt-4">If you see this, the new code IS working!</p>
      <p className="mt-2">Time: {new Date().toISOString()}</p>
    </div>
  );
}

