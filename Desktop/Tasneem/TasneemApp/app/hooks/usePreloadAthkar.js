import { useEffect, useState } from 'react';
import { preloadAthkarSurahs } from '../utils/athkarLoader';

/**
 * Hook to preload athkar Quranic surahs
 * Call this in your main App component or navigation setup
 * This improves performance by loading surahs before user opens athkar
 * 
 * @returns {Object} { isLoaded, isLoading, error }
 */
export const usePreloadAthkar = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const preload = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await preloadAthkarSurahs();
        setIsLoaded(true);
      } catch (err) {
        console.error('Error preloading athkar:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    preload();
  }, []);

  return { isLoaded, isLoading, error };
};

/**
 * Example usage in your App.js or main navigation component:
 * 
 * import { usePreloadAthkar } from './hooks/usePreloadAthkar';
 * 
 * function App() {
 *   const { isLoaded, isLoading } = usePreloadAthkar();
 *   
 *   // Optionally show a loading screen until athkar is preloaded
 *   if (isLoading) {
 *     return <LoadingScreen />;
 *   }
 *   
 *   return <YourAppContent />;
 * }
 */