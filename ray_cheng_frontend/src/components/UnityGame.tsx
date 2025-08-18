import React, { useEffect, useRef, useState, useCallback } from 'react';

// 添加CSS动画样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .immersive-fullscreen-container {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
`;

if (!document.head.querySelector('style[data-unity-game-styles]')) {
  styleSheet.setAttribute('data-unity-game-styles', 'true');
  document.head.appendChild(styleSheet);
}

interface UnityGameProps {
  className?: string;
}

// 声明Unity全局对象
declare global {
  interface Window {
    createUnityInstance?: (
      container: HTMLCanvasElement,
      config: {
        dataUrl: string;
        frameworkUrl: string;
        codeUrl: string;
        streamingAssetsUrl?: string;
        companyName?: string;
        productName?: string;
        productVersion?: string;
      },
      onProgress?: (progress: number) => void
    ) => Promise<any>;
  }
}

const UnityGame: React.FC<UnityGameProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [unityInstance, setUnityInstance] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [canvasResolution, setCanvasResolution] = useState({ width: 960, height: 600 });

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const hasTouchSupport = 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth <= 768;
      
      // 更严格的移动端检测：必须有触摸支持或者是移动端UserAgent
      return isMobileUserAgent || (hasTouchSupport && isSmallScreen);
    };
    
    const mobile = checkMobile();
    setIsMobile(mobile);
    
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
    console.log('Mobile device detection result:', { 
      mobile, 
      userAgent: navigator.userAgent.toLowerCase(),
      isMobileUserAgent: mobileKeywords.some(keyword => navigator.userAgent.toLowerCase().includes(keyword)),
      hasTouch: 'ontouchstart' in window,
      isSmallScreen: window.innerWidth <= 768,
      windowWidth: window.innerWidth 
    });
    
    // Listen for window size changes
    const handleResize = () => {
      const newMobile = checkMobile();
      setIsMobile(newMobile);
      console.log('Window size changed - mobile status:', newMobile);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 沉浸式全屏效果：禁用页面滚动、锁定视角
  useEffect(() => {
    if (isFullscreen && isMobile) {
      // 保存原始body样式
      const originalBodyStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        width: document.body.style.width,
        height: document.body.style.height,
        touchAction: document.body.style.touchAction,
        userSelect: document.body.style.userSelect
      };

      // 设置沉浸式全屏样式
      document.body.style.overflow = 'hidden'; // 禁止滚动
      document.body.style.position = 'fixed'; // 固定位置，防止地址栏影响
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.touchAction = 'none'; // 禁用触摸手势
      document.body.style.userSelect = 'none'; // 禁用文本选择

      // 禁用页面缩放
      const viewport = document.querySelector('meta[name="viewport"]');
      const originalViewport = viewport?.getAttribute('content') || '';
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      // 阻止默认的触摸事件
      const preventDefaultTouch = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault(); // 防止多点触控缩放
        }
      };

      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      // 添加事件监听器
      document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
      document.addEventListener('gesturestart', preventScroll, { passive: false });
      document.addEventListener('gesturechange', preventScroll, { passive: false });
      document.addEventListener('gestureend', preventScroll, { passive: false });
      
      console.log('Immersive fullscreen mode activated');

      return () => {
        // 恢复原始样式
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.position = originalBodyStyle.position;
        document.body.style.width = originalBodyStyle.width;
        document.body.style.height = originalBodyStyle.height;
        document.body.style.touchAction = originalBodyStyle.touchAction;
        document.body.style.userSelect = originalBodyStyle.userSelect;

        // 恢复viewport设置
        if (viewport && originalViewport) {
          viewport.setAttribute('content', originalViewport);
        }

        // 移除事件监听器
        document.removeEventListener('touchmove', preventDefaultTouch);
        document.removeEventListener('gesturestart', preventScroll);
        document.removeEventListener('gesturechange', preventScroll);
        document.removeEventListener('gestureend', preventScroll);
        
        console.log('Immersive fullscreen mode deactivated');
      };
    }
  }, [isFullscreen, isMobile]);

  // Unity Canvas resize when fullscreen changes
  useEffect(() => {
    if (!unityInstance || !canvasRef.current) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isFullscreen) {
        // 获取设备的实际分辨率
        const devicePixelRatio = window.devicePixelRatio || 1;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 计算实际的Canvas分辨率
        const actualWidth = Math.floor(screenWidth * devicePixelRatio);
        const actualHeight = Math.floor(screenHeight * devicePixelRatio);

        if (isMobile) {
          // 移动端：以1440p标准为基准，确保高质量显示
          const maxWidth = 1920;
          const maxHeight = 1080;
          const minWidth = 1440; // 最低1440p标准
          const minHeight = 900; // 对应1440p的高度基准
          
          // 计算目标分辨率：使用devicePixelRatio但限制在合理范围
          let baseWidth = screenWidth;
          let baseHeight = screenHeight;
          
          // 如果CSS尺寸太小，按devicePixelRatio放大到1440p标准
          if (baseWidth < minWidth || baseHeight < minHeight) {
            // 使用devicePixelRatio提升到至少1440p
            baseWidth = Math.max(screenWidth * devicePixelRatio, minWidth);
            baseHeight = Math.max(screenHeight * devicePixelRatio, minHeight);
          } else {
            // CSS尺寸已经足够大，适度使用devicePixelRatio
            const scaleFactor = Math.min(devicePixelRatio, 2); // 最多2倍放大
            baseWidth = screenWidth * scaleFactor;
            baseHeight = screenHeight * scaleFactor;
          }
          
          // 确保不超过最大限制
          let targetWidth = Math.min(baseWidth, maxWidth);
          let targetHeight = Math.min(baseHeight, maxHeight);
          
          // 如果仍然超限，按比例缩小
          if (targetWidth > maxWidth || targetHeight > maxHeight) {
            const scaleX = maxWidth / targetWidth;
            const scaleY = maxHeight / targetHeight;
            const scale = Math.min(scaleX, scaleY);
            
            targetWidth = Math.floor(targetWidth * scale);
            targetHeight = Math.floor(targetHeight * scale);
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          // 移动端全屏：使用dvh而不是vh，避免地址栏影响
          // 先设置fallback值，再设置新标准
          canvas.style.width = '100vw'; // fallback
          canvas.style.height = '100vh'; // fallback
          // 如果浏览器支持dvh，则使用dvh
          if (CSS.supports('height', '100dvh')) {
            canvas.style.width = '100dvw'; // 动态视口宽度
            canvas.style.height = '100dvh'; // 动态视口高度，排除地址栏
          }
          canvas.style.maxWidth = 'none';
          canvas.style.maxHeight = 'none';
          canvas.style.minWidth = '100vw'; // fallback
          canvas.style.minHeight = '100vh'; // fallback
          if (CSS.supports('height', '100dvh')) {
            canvas.style.minWidth = '100dvw';
            canvas.style.minHeight = '100dvh';
          }
          canvas.style.objectFit = 'fill'; // 移动端完全填充
          // 确保高分辨率生效
          canvas.style.imageRendering = 'auto'; // 使用浏览器最佳渲染
          // 处理安全区域
          canvas.style.paddingTop = 'env(safe-area-inset-top, 0)';
          canvas.style.paddingBottom = 'env(safe-area-inset-bottom, 0)';
          canvas.style.paddingLeft = 'env(safe-area-inset-left, 0)';
          canvas.style.paddingRight = 'env(safe-area-inset-right, 0)';
          canvas.style.boxSizing = 'border-box';
          
          // 更新状态
          setCanvasResolution({ width: targetWidth, height: targetHeight });
          
          console.log('Mobile fullscreen canvas resolution (1440p standard):', {
            cssSize: `${screenWidth}x${screenHeight}`,
            devicePixelRatio,
            baseSize: `${baseWidth}x${baseHeight}`,
            finalSize: `${targetWidth}x${targetHeight}`,
            minStandard: `${minWidth}x${minHeight}`,
            maxLimit: `${maxWidth}x${maxHeight}`,
            cssStyle: {
              width: canvas.style.width,
              height: canvas.style.height,
              maxWidth: canvas.style.maxWidth,
              maxHeight: canvas.style.maxHeight
            }
          });
        } else {
          // 桌面端：严格限制最大分辨率为1920x1080，保持游戏比例
          canvas.style.width = '100vw';
          canvas.style.height = '100vh';
          canvas.style.maxWidth = 'none';
          canvas.style.maxHeight = 'none';
          canvas.style.minWidth = '100vw';
          canvas.style.minHeight = '100vh';
          canvas.style.objectFit = 'contain'; // 桌面端保持比例
          canvas.style.imageRendering = 'auto'; // 使用浏览器最佳渲染
          // 桌面端重置安全区域
          canvas.style.padding = '0';
          canvas.style.boxSizing = 'content-box';
          
          const gameAspectRatio = 960 / 600; // 16:10
          const maxWidth = 1920;
          const maxHeight = 1080;
          
          // 计算基于屏幕尺寸的目标分辨率，但保持游戏比例
          let targetWidth, targetHeight;
          
          if (screenWidth / screenHeight > gameAspectRatio) {
            // 屏幕更宽，以高度为准
            targetHeight = Math.min(screenHeight, maxHeight);
            targetWidth = Math.floor(targetHeight * gameAspectRatio);
          } else {
            // 屏幕更高，以宽度为准
            targetWidth = Math.min(screenWidth, maxWidth);
            targetHeight = Math.floor(targetWidth / gameAspectRatio);
          }
          
          // 最终检查不要超过最大限制
          if (targetWidth > maxWidth) {
            targetWidth = maxWidth;
            targetHeight = Math.floor(targetWidth / gameAspectRatio);
          }
          if (targetHeight > maxHeight) {
            targetHeight = maxHeight;
            targetWidth = Math.floor(targetHeight * gameAspectRatio);
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // 更新状态
          setCanvasResolution({ width: targetWidth, height: targetHeight });
          
          console.log('Desktop fullscreen canvas resolution (safe):', {
            cssSize: `${screenWidth}x${screenHeight}`,
            finalSize: `${targetWidth}x${targetHeight}`,
            maxLimit: `${maxWidth}x${maxHeight}`,
            gameAspectRatio
          });
        }
        
        canvas.style.position = 'static';  // 重置positioning，让容器处理定位
      } else {
        // Normal mode: restore original dimensions
        if (isMobile) {
          // 移动端：简化尺寸计算，保持居中
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const gameAspectRatio = 960 / 600; // 游戏原始比例 16:10
          const isLandscapeMode = viewportWidth > viewportHeight;
          
          if (isLandscapeMode) {
            // 横屏模式：将由全屏模式处理，这里设置临时大小
            const containerWidth = viewportWidth - 20; // 留出边距
            const targetHeight = Math.min(viewportHeight * 0.8, containerWidth / gameAspectRatio);
            const targetWidth = targetHeight * gameAspectRatio;
            
            canvas.style.width = `${targetWidth}px`;
            canvas.style.height = `${targetHeight}px`;
          } else {
            // 竖屏模式：使用容器宽度的90%，保持比例
            const containerWidth = viewportWidth - 20; // 留出边距
            const targetWidth = Math.min(containerWidth * 0.9, 960);
            const targetHeight = targetWidth / gameAspectRatio;
            
            // 确保高度不超过视口的50%
            const maxHeight = viewportHeight * 0.5;
            if (targetHeight > maxHeight) {
              const adjustedHeight = maxHeight;
              const adjustedWidth = adjustedHeight * gameAspectRatio;
              canvas.style.width = `${adjustedWidth}px`;
              canvas.style.height = `${adjustedHeight}px`;
            } else {
              canvas.style.width = `${targetWidth}px`;
              canvas.style.height = `${targetHeight}px`;
            }
          }
          
          canvas.style.maxWidth = '100%';
          canvas.style.maxHeight = 'none';
          
          console.log('Mobile canvas sizing (simplified):', {
            viewportSize: `${viewportWidth}x${viewportHeight}`,
            isLandscape: isLandscapeMode,
            canvasSize: `${canvas.style.width} x ${canvas.style.height}`,
            containerWidth: viewportWidth - 20
          });
        } else {
          // 桌面端：恢复原始尺寸
          canvas.width = 960;
          canvas.height = 600;
          canvas.style.width = '960px';
          canvas.style.height = '600px';
          canvas.style.maxWidth = '960px';
          canvas.style.maxHeight = '600px';
        }
        canvas.style.objectFit = 'contain'; // 保持比例
        canvas.style.position = 'static';  // 重置positioning
        
        // 在非全屏模式下，恢复原始Canvas分辨率
        if (!canvas.width || canvas.width === 0) {
          canvas.width = 960;
          canvas.height = 600;
        }
        
        // 更新状态为原始分辨率
        setCanvasResolution({ width: 960, height: 600 });
        
        console.log('Unity canvas resized for normal mode:', {
          canvasSize: `${canvas.width}x${canvas.height}`,
          cssSize: `${canvas.style.width} x ${canvas.style.height}`
        });
      }

      // Force canvas reflow
      void canvas.offsetHeight;
      
      // Notify Unity about canvas size change if possible
      try {
        if ((window as any).unityGameInstance) {
          // 通知Unity Canvas的内部分辨率变化
          if ((window as any).unityGameInstance.Module && (window as any).unityGameInstance.Module.setCanvasSize) {
            (window as any).unityGameInstance.Module.setCanvasSize(canvas.width, canvas.height);
            console.log('Notified Unity of canvas resolution change:', {
              width: canvas.width,
              height: canvas.height
            });
          }
          
          // 如果有sendMessage方法，也通知Unity游戏逻辑
          if ((window as any).unityGameInstance.SendMessage) {
            (window as any).unityGameInstance.SendMessage('Main Camera', 'OnResolutionChanged', `${canvas.width}x${canvas.height}`);
          }
        }
      } catch (err) {
        console.warn('Could not notify Unity about canvas resize:', err);
      }
    };

    // Delay resize to ensure DOM updates are complete
    const timeoutId = setTimeout(resizeCanvas, 100);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, isMobile, unityInstance]);

  // 全屏功能
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (isMobile) {
        // 移动端：先锁定屏幕方向为横屏
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            await (window.screen.orientation as any).lock('landscape-primary');
            console.log('Screen orientation locked to landscape');
          } catch (err) {
            console.warn('Could not lock screen orientation:', err);
            // 尝试备用方法
            try {
              await (window.screen.orientation as any).lock('landscape');
            } catch (fallbackErr) {
              console.warn('Fallback orientation lock also failed:', fallbackErr);
            }
          }
        }

        // 尝试进入沉浸式模式（隐藏地址栏等UI）
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // 桌面端：直接进入全屏
        await containerRef.current.requestFullscreen();
      }
      
      setIsFullscreen(true);
      console.log('Entered immersive fullscreen mode');
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, [isMobile]);

  const exitFullscreen = useCallback(async () => {
    try {
      // 先退出全屏模式
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // 移动端：解锁屏幕方向
      if (isMobile && 'screen' in window && 'orientation' in window.screen) {
        try {
          await (window.screen.orientation as any).unlock();
          console.log('Screen orientation unlocked');
        } catch (err) {
          console.warn('Could not unlock screen orientation:', err);
        }
      }
      
      setIsFullscreen(false);
      console.log('Exited immersive fullscreen mode');
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  }, [isMobile]);

  // ESC key to exit fullscreen (PC only)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, exitFullscreen]);

  // Orientation change detection - auto fullscreen/exit based on orientation (for all devices)
  useEffect(() => {
    const checkAndHandleOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const aspectRatio = window.innerWidth / window.innerHeight;
      const isSmallScreen = window.innerWidth <= 1024; // 扩大检测范围到平板尺寸
      
      console.log('Orientation check:', { 
        isLandscape, 
        isFullscreen, 
        width: window.innerWidth, 
        height: window.innerHeight,
        aspectRatio: aspectRatio.toFixed(2),
        isSmallScreen,
        isMobile,
        unityLoaded: !!unityInstance,
        isGameLoaded,
        currentFullscreenElement: !!document.fullscreenElement
      });
      
      // 移动端设备在横屏时自动全屏，竖屏时退出全屏
      if (isMobile) {
        if (isLandscape && aspectRatio > 1.1 && !isFullscreen && unityInstance && isGameLoaded) {
          console.log('Mobile landscape detected, auto entering fullscreen');
          enterFullscreen();
        } else if (!isLandscape && isFullscreen) {
          console.log('Mobile portrait detected, auto exiting fullscreen');
          exitFullscreen();
        }
      }
      // 其他小屏设备（平板等）的处理
      else if (isSmallScreen && isLandscape && aspectRatio > 1.2 && !isFullscreen && unityInstance && isGameLoaded) {
        console.log('Small screen landscape detected, auto entering fullscreen');
        enterFullscreen();
      }
    };

    const handleOrientationChange = () => {
      setTimeout(checkAndHandleOrientation, 300);
    };

    // 初始检测 - 当游戏加载完成后立即检查方向
    if (unityInstance && isGameLoaded) {
      setTimeout(checkAndHandleOrientation, 500);
    }
    
    // 页面加载时的初始检测（针对已经是横屏状态的情况）
    setTimeout(checkAndHandleOrientation, 1000);

    // Monitor orientation changes for auto-fullscreen (all devices)
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile, isFullscreen, unityInstance, isGameLoaded, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    let isMounted = true;

    const loadUnityGame = async () => {
      // 防止重复加载的守卫条件
      if (!canvasRef.current || isGameLoaded || unityInstance) {
        console.log('Skipping Unity game load:', { 
          canvasAvailable: !!canvasRef.current, 
          isGameLoaded, 
          unityInstanceExists: !!unityInstance 
        });
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        setLoadingProgress(0);

        // 动态加载Unity loader脚本
        const loaderScript = document.createElement('script');
        loaderScript.src = '/games/Build/RayChengSuperHexagonWebGL.loader.js';
        
        loaderScript.onload = async () => {
          if (!isMounted || !canvasRef.current) return;

          try {
            if (!window.createUnityInstance) {
              throw new Error('Unity loader not available');
            }

            const config = {
              dataUrl: '/games/Build/RayChengSuperHexagonWebGL.data',
              frameworkUrl: '/games/Build/RayChengSuperHexagonWebGL.framework.js',
              codeUrl: '/games/Build/RayChengSuperHexagonWebGL.wasm',
              streamingAssetsUrl: 'StreamingAssets',
              companyName: 'RayCheng',
              productName: 'Super Hexagon',
              productVersion: '1.0',
              // WebGL 特定配置
              matchWebGLToCanvasSize: true,
              devicePixelRatio: 1,
            };

            const instance = await window.createUnityInstance(
              canvasRef.current,
              config,
              (progress: number) => {
                if (isMounted) {
                  setLoadingProgress(Math.round(progress * 100));
                }
              }
            );

            if (isMounted) {
              setUnityInstance(instance);
              setIsGameLoaded(true);
              setIsLoading(false);
              console.log('Unity game loaded successfully');
              
              // Store instance for resizing
              (window as any).unityGameInstance = instance;
            }
          } catch (err) {
            if (isMounted) {
              console.error('Failed to load Unity game:', err);
              setError(`Failed to load game: ${err instanceof Error ? err.message : 'Unknown error'}`);
              setIsLoading(false);
            }
          }
        };

        loaderScript.onerror = () => {
          if (isMounted) {
            setError('Failed to load Unity loader script');
            setIsLoading(false);
          }
        };

        document.head.appendChild(loaderScript);

        // 清理函数
        return () => {
          if (loaderScript.parentNode) {
            loaderScript.parentNode.removeChild(loaderScript);
          }
        };
      } catch (err) {
        if (isMounted) {
          console.error('Error setting up Unity game:', err);
          setError(`Setup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    // 延迟加载以确保DOM已准备好
    const timeoutId = setTimeout(loadUnityGame, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      
      // 清理Unity实例
      if (unityInstance && unityInstance.quit) {
        try {
          unityInstance.quit();
          console.log('Unity instance cleaned up successfully');
        } catch (err) {
          console.warn('Error quitting Unity instance:', err);
        }
      }
      
      // 清理全局实例引用
      if ((window as any).unityGameInstance) {
        (window as any).unityGameInstance = null;
      }
    };
  }, []); // 只在组件挂载时运行一次

  const handleRetry = () => {
    // 清理当前状态
    setError('');
    setLoadingProgress(0);
    setIsGameLoaded(false);
    setUnityInstance(null);
    
    // 清理全局Unity实例
    if ((window as any).unityGameInstance) {
      try {
        (window as any).unityGameInstance.quit();
      } catch (err) {
        console.warn('Error quitting Unity instance during retry:', err);
      }
      (window as any).unityGameInstance = null;
    }
    
    // 重新加载页面作为最后手段
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div 
      className={`unity-game-container ${className || ''}`}
      style={{
        width: '100%',
        maxWidth: isMobile ? '100vw' : '1024px',
        margin: '0 auto',
        textAlign: 'center',
        padding: isMobile ? '0 10px' : '0 20px',
        boxSizing: 'border-box'
      }}
    >
      {error && (
        <div style={{
          background: '#ff4444',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>❌ Game Loading Failed</h3>
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            style={{
              background: '#fff',
              color: '#ff4444',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{
          background: '#333',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🎮 Loading Game...</h3>
          <div style={{
            background: '#555',
            height: '20px',
            borderRadius: '10px',
            overflow: 'hidden',
            margin: '10px 0'
          }}>
            <div style={{
              background: '#4CAF50',
              height: '100%',
              width: `${loadingProgress}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p>{loadingProgress}%</p>
        </div>
      )}

      <div 
        ref={containerRef}
        className={isFullscreen && isMobile ? 'immersive-fullscreen-container' : ''}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isMobile ? '100%' : '960px',
          margin: '0 auto',
          padding: '0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          // 全屏时的样式
          ...(isFullscreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            margin: 0,
            padding: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // 确保容器完全覆盖视口
            boxSizing: 'border-box',
            // 移动端沉浸式效果增强
            ...(isMobile && {
              animation: 'fadeIn 0.3s ease-in-out',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden'
            })
          })
        }}
      >
        {/* 全屏按钮 - 桌面端和大屏设备显示 */}
        {!error && (window.innerWidth > 1024 || !isMobile) && (
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10000,
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              minWidth: '60px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={isFullscreen ? 'Exit Fullscreen (ESC or Click)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '❌' : '⛶'}
            {isFullscreen ? 'Exit' : 'Full'}
          </button>
        )}

        <canvas 
          ref={canvasRef}
          id="unity-canvas"
          style={{
            // Mobile portrait: fit to screen width, maintain aspect ratio
            // Mobile landscape: true fullscreen
            // Desktop: fixed size or fullscreen
            width: isFullscreen 
              ? (isMobile ? '100dvw' : '100vw')  // 移动端使用动态视口，桌面端使用标准视口
              : (isMobile ? '100%' : '960px'), // 移动端使用100%让容器控制尺寸
            height: isFullscreen 
              ? (isMobile ? '100dvh' : '100vh')  // 移动端使用动态视口高度
              : (isMobile ? 'auto' : '600px'),
            maxWidth: isFullscreen 
              ? 'none' 
              : (isMobile ? '100%' : '960px'),
            maxHeight: isFullscreen 
              ? 'none' 
              : 'none', // 让高度自动计算
            // 关键：确保Canvas不被父容器限制
            minWidth: isFullscreen ? (isMobile ? '100dvw' : '100vw') : 'auto',
            minHeight: isFullscreen ? (isMobile ? '100dvh' : '100vh') : 'auto',
            // 移动端全屏时处理安全区域
            ...(isFullscreen && isMobile && {
              paddingTop: 'env(safe-area-inset-top, 0)',
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
              paddingLeft: 'env(safe-area-inset-left, 0)',
              paddingRight: 'env(safe-area-inset-right, 0)',
              boxSizing: 'border-box'
            }),
            background: '#231F20',
            display: error ? 'none' : 'block',
            border: isFullscreen ? 'none' : '1px solid #444',
            // 确保Canvas不被缩放，在全屏时使用最佳渲染
            imageRendering: isFullscreen ? 'auto' : 'pixelated',
            // 防止浏览器默认的触摸行为
            touchAction: 'none',
            userSelect: 'none',
            // 确保Canvas居中且不溢出
            margin: '0 auto',
            // 全屏时填充整个屏幕
            ...(isFullscreen && {
              width: '100vw',
              height: '100vh',
              maxWidth: 'none',
              maxHeight: 'none',
              objectFit: isMobile ? 'fill' : 'contain',  // 移动端填充，桌面端保持比例
              // 移动端沉浸式全屏样式
              ...(isMobile && {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100dvw !important',  // 强制使用动态视口宽度
                height: '100dvh !important', // 强制使用动态视口高度
                zIndex: 10000,
                touchAction: 'manipulation', // 允许游戏内的触摸操作
                WebkitTouchCallout: 'none', // iOS：禁用长按菜单
                WebkitUserSelect: 'none',   // iOS：禁用文本选择
                WebkitTapHighlightColor: 'transparent', // iOS：禁用点击高亮
                msContentZooming: 'none',   // IE：禁用缩放
                msTouchAction: 'manipulation', // IE：触摸操作
                imageRendering: 'auto',  // 确保高分辨率渲染
                // 处理安全区域边距
                paddingTop: 'env(safe-area-inset-top, 0)',
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
                paddingLeft: 'env(safe-area-inset-left, 0)',
                paddingRight: 'env(safe-area-inset-right, 0)',
                boxSizing: 'border-box'
              })
            })
          }}
          width={canvasResolution.width}
          height={canvasResolution.height}
        />

        {/* 全屏时的说明文字 */}
        {isFullscreen && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '14px' : '14px',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: isMobile ? '12px 24px' : '8px 16px',
            borderRadius: '25px',
            pointerEvents: 'none',
            maxWidth: isMobile ? '80vw' : 'auto',
            lineHeight: '1.4',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {isMobile ? (
              <>
                🎮 <strong>沉浸式游戏模式已激活</strong><br/>
                旋转至竖屏可退出全屏
              </>
            ) : (
              'Press ESC key or click top-right button to exit fullscreen'
            )}
          </div>
        )}
      </div>

      {!isLoading && !error && !unityInstance && (
        <div style={{
          background: '#333',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h3>🎮 Preparing Game</h3>
          <p>Unity WebGL game will start soon...</p>
          {isMobile && (
            <p style={{ fontSize: '14px', color: '#aaa', marginTop: '10px' }}>
              💡 Tip: Rotate to landscape for automatic fullscreen mode
            </p>
          )}
        </div>
      )}

      {/* Mobile Tips */}
      {isMobile && !isLoading && !error && unityInstance && !isFullscreen && (
        <div style={{
          background: 'rgba(0, 123, 255, 0.1)',
          border: '1px solid rgba(0, 123, 255, 0.3)',
          color: '#007bff',
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0',
          fontSize: '14px'
        }}>
          📱 <strong>Mobile Tip:</strong> Rotate to landscape for automatic fullscreen mode and best gaming experience
        </div>
      )}


    </div>
  );
};

export default UnityGame;
