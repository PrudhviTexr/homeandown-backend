import React from 'react';
import { TreePine, Leaf, TrendingUp } from 'lucide-react';

interface TreePlantingProgressProps {
  totalSales: number;
  className?: string;
}

const TreePlantingProgress: React.FC<TreePlantingProgressProps> = ({ 
  totalSales, 
  className = '' 
}) => {
  const treesPlanted = totalSales; // 1 tree per sale
  const nextMilestone = Math.ceil(treesPlanted / 10) * 10;
  const progressToNextMilestone = ((treesPlanted % 10) / 10) * 100;

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <TreePine className="w-8 h-8 text-green-600 mr-3" />
          <h3 className="text-2xl font-bold text-green-800">Environmental Impact</h3>
        </div>
        <p className="text-green-700 text-sm">🌱 We plant one tree for every property sold through our platform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TreePine className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-3xl font-bold text-green-700">{treesPlanted}</span>
          </div>
          <p className="text-green-600 font-medium">Trees Planted</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Leaf className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-3xl font-bold text-green-700">{Math.round(treesPlanted * 22)}</span>
          </div>
          <p className="text-green-600 font-medium">kg CO₂ Absorbed/Year</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-3xl font-bold text-green-700">{Math.round(treesPlanted * 0.5)}</span>
          </div>
          <p className="text-green-600 font-medium">Acres Reforested</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-green-700 mb-2">
          <span className="font-medium">Progress to {nextMilestone} trees milestone</span>
          <span className="font-bold">{treesPlanted % 10}/10</span>
        </div>
        <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressToNextMilestone}%` }}
          >
            <div className="h-full bg-gradient-to-r from-transparent to-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {treesPlanted >= 10 && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
          <p className="text-sm text-green-800 font-medium text-center">
            🎉 Milestone achieved! You've contributed to planting {Math.floor(treesPlanted / 10) * 10}+ trees!
          </p>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <p className="text-xs text-green-600 italic">
          Together, we're building a greener future, one property sale at a time
        </p>
      </div>
    </div>
  );
};

export default TreePlantingProgress;