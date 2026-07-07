"use client";
import { useEffect, useRef } from 'react';

interface DonutChartProps {
  title: string;
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  className?: string;
}

const DonutChart = ({ title, data, className = "" }: DonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 80;
    const innerRadius = 50;

    // Calculate total value
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw donut segments
    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw segment
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Draw inner circle (white)
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

  }, [data]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="flex-shrink-0">
          <canvas 
            ref={canvasRef}
            className="w-48 h-48"
          />
        </div>
      </div>
    </div>
  );
};

export default DonutChart; 