import React, { useEffect, useRef, useState, useCallback } from 'react';

// 添加CSS样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  /* Unity游戏容器：16:9比例，自适应 */
  .unity-container {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 9;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
  }

  /* Canvas样式：填满容器 */
  .unity-canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    background: #231F20;
  }

  /* 全屏模式 */
  .unity-fullscreen {
    position: fixed !important;
    top: 0;
    left: 0;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999;
    background: #000;
  }

  /* 移动端优化 */
  @media (max-width: 768px) {
    .unity-container {
      margin: 10px;
      border-radius: 8px;
      overflow: hidden;
    }
  }
`;

if (!document.head.querySelector('style[data-unity-styles]')) {
  styleSheet.setAttribute('data-unity-styles', 'true');
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

// 获取设备像素比，iOS设备限制上限以优化性能
function getDPRCap() {
  const dpr = window.devicePixelRatio || 1;
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  // iOS WebGL 内存较紧，限制在 2，其他设备限制在 2.5
  return Math.min(dpr, isiOS ? 2 : 2.5);
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

  // 简化移动设备检测
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const hasTouchSupport = 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth <= 768;
      
      return isMobileUserAgent || (hasTouchSupport && isSmallScreen);
    };
    
    setIsMobile(checkMobile());
    
    const handleResize = () => setIsMobile(checkMobile());
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

  // 简化的Canvas分辨率管理 - 使用DPR提升画质
  useEffect(() => {
    if (!unityInstance || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = getDPRCap(); // 获取优化的设备像素比
    
    // CSS尺寸保持不变（由CSS控制），只调整内部渲染分辨率
    const cssWidth = canvas.offsetWidth;
    const cssHeight = canvas.offsetHeight;
    
    // 内部渲染分辨率 = CSS尺寸 × DPR
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    
    // 通知Unity关于Canvas尺寸变化
    try {
      if ((window as any).unityGameInstance?.Module?.setCanvasSize) {
        (window as any).unityGameInstance.Module.setCanvasSize(canvas.width, canvas.height);
      }
    } catch (err) {
      console.warn('Unity canvas resize failed:', err);
    }
    
    console.log('Canvas resolution updated:', {
      css: `${cssWidth}×${cssHeight}`,
      internal: `${canvas.width}×${canvas.height}`,
      dpr
    });
  }, [isFullscreen, unityInstance]);

  // 简化的全屏功能
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      // 移动端尝试锁定横屏
      if (isMobile && 'screen' in window && 'orientation' in window.screen) {
        try {
          await (window.screen.orientation as any).lock('landscape-primary');
        } catch (err) {
          console.warn('Screen orientation lock failed:', err);
        }
      }

      // 进入全屏模式
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, [isMobile]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // 移动端解锁屏幕方向
      if (isMobile && 'screen' in window && 'orientation' in window.screen) {
        try {
          await (window.screen.orientation as any).unlock();
        } catch (err) {
          console.warn('Screen orientation unlock failed:', err);
        }
      }
      
      setIsFullscreen(false);
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

  // 简化的方向检测 - 移动端横屏自动全屏
  useEffect(() => {
    if (!isMobile || !unityInstance || !isGameLoaded) return;

    const handleOrientationChange = () => {
      setTimeout(() => {
        const isLandscape = window.innerWidth > window.innerHeight;
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        if (isLandscape && aspectRatio > 1.1 && !isFullscreen) {
          console.log('Mobile landscape detected, entering fullscreen');
          enterFullscreen();
        } else if (!isLandscape && isFullscreen) {
          console.log('Mobile portrait detected, exiting fullscreen');
          exitFullscreen();
        }
      }, 300);
    };

    // 初始检测
    setTimeout(handleOrientationChange, 500);

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
              // 优化配置：自动匹配Canvas尺寸，使用优化的DPR
              matchWebGLToCanvasSize: true,
              devicePixelRatio: getDPRCap(),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时运行一次，isGameLoaded和unityInstance用于防重复加载守卫

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
        className={`unity-container ${isFullscreen ? 'unity-fullscreen' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          className="unity-canvas"
          style={{
            display: error ? 'none' : 'block',
            border: isFullscreen ? 'none' : '1px solid #444',
          }}
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

      {/* 移动端提示 */}
      {isMobile && !isLoading && !error && unityInstance && !isFullscreen && (
        <div style={{
          background: 'rgba(0, 123, 255, 0.1)',
          border: '1px solid rgba(0, 123, 255, 0.3)',
          color: '#007bff',
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          📱 <strong>移动端提示:</strong> 横屏旋转自动进入全屏游戏模式，获得最佳游戏体验
        </div>
      )}


    </div>
  );
};

export default UnityGame;
