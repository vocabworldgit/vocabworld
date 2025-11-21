'use client';

import { Icon } from '@iconify/react';

export default function TestIcons() {
  // Let's test some basic Solar icons first
  const testIcons = [
    'solar:home-bold',
    'solar:star-bold',
    'solar:heart-bold',
    'solar:book-bold',
    'solar:palette-bold',
    'solar:tree-bold',
    'solar:leaf-bold',
    'solar:flower-bold',
    'solar:sun-bold',
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Solar Icon Test</h2>
      <div className="grid grid-cols-3 gap-4">
        {testIcons.map((iconName) => (
          <div key={iconName} className="flex flex-col items-center p-2 border rounded">
            <Icon icon={iconName} width="24" height="24" className="mb-2" />
            <span className="text-xs text-center">{iconName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
