'use client';

import { useEffect, useRef } from 'react';

export function AdBanner() {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isScriptsLoaded = useRef(false);

  useEffect(() => {
    const container = adContainerRef.current;
    if (isScriptsLoaded.current || !container) {
      return;
    }

    const loadBannerAd = (config: object, src: string): Promise<void> => {
      return new Promise((resolve) => {
        // Set the global options object for the next script to read
        (window as any).atOptions = config;

        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = src;
        
        // Resolve the promise once the script is loaded, so the next one can start
        invokeScript.onload = () => resolve();
        // Also resolve on error to prevent blocking subsequent ads
        invokeScript.onerror = () => resolve(); 
        
        container.appendChild(invokeScript);
      });
    };
    
    const loadNativeAd = () => {
        const nativeBannerContainer = document.createElement('div');
        nativeBannerContainer.id = 'container-8a30ee50cf98e47be92f1f73320b34df';
        container.appendChild(nativeBannerContainer);
        
        const invokeScript = document.createElement('script');
        invokeScript.async = true;
        invokeScript.setAttribute('data-cfasync', 'false');
        invokeScript.src = '//pl26974340.profitableratecpm.com/8a30ee50cf98e47be92f1f73320b34df/invoke.js';
        container.appendChild(invokeScript);
    };
    
    const loadAllAdsSequentially = async () => {
        // --- Ad 1: 300x250 ---
        await loadBannerAd({
            'key' : '85a4fee3aa8d13d38d9a1cf01a95849f',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
        }, '//www.highperformanceformat.com/85a4fee3aa8d13d38d9a1cf01a95849f/invoke.js');
        
        // --- Ad 2: 160x300 ---
        await loadBannerAd({
            'key' : 'ce5cc2223ef1c9b430784445e58c2273',
            'format' : 'iframe',
            'height' : 300,
            'width' : 160,
            'params' : {}
        }, '//www.highperformanceformat.com/ce5cc2223ef1c9b430784445e58c2273/invoke.js');
        
        // --- Ad 3: 320x50 ---
        await loadBannerAd({
            'key' : 'c95e7e6770fd1266273791de339c0972',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
        }, '//www.highperformanceformat.com/c95e7e6770fd1266273791de339c0972/invoke.js');
        
        // --- Ad 4: Native Banner (independent) ---
        loadNativeAd();
    };

    loadAllAdsSequentially();
    isScriptsLoaded.current = true;

  }, []);

  return <div ref={adContainerRef} className="flex flex-col items-center gap-4 p-2" />;
}
