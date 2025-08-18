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
        // 获取设备的实际物理屏幕分辨率
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // 获取真实的物理屏幕分辨率
        // eslint-disable-next-line no-restricted-globals
        const cssScreenWidth = screen.width;
        // eslint-disable-next-line no-restricted-globals
        const cssScreenHeight = screen.height;
        
        // 计算真实物理分辨率 = CSS尺寸 × devicePixelRatio
        const physicalScreenWidth = cssScreenWidth * devicePixelRatio;
        const physicalScreenHeight = cssScreenHeight * devicePixelRatio;
        
        console.log('📐 真实屏幕分辨率检测:', {
          '📱 CSS逻辑像素 (screen.*)': `${cssScreenWidth}×${cssScreenHeight}`,
          '🔍 Device Pixel Ratio': devicePixelRatio,
          '🖥️ 真实物理分辨率': `${physicalScreenWidth}×${physicalScreenHeight}`,
          '🌐 浏览器视口 (window.inner*)': `${window.innerWidth}×${window.innerHeight}`,
          '🎯 用于计算': `${physicalScreenWidth}×${physicalScreenHeight} (真实物理分辨率)`
        });
        
        // 关键修复：使用CSS逻辑像素而不是物理像素
        // CSS显示区域是逻辑像素，Canvas分辨率也应该基于逻辑像素
        const screenWidth = cssScreenWidth;
        const screenHeight = cssScreenHeight;
        
        // 物理分辨率仅用于日志显示
        // const actualWidth = Math.floor(screenWidth * devicePixelRatio);
        // const actualHeight = Math.floor(screenHeight * devicePixelRatio);

        if (isMobile) {
          // 移动端：保持游戏原始宽高比，避免UI变形
          const isLandscape = screenWidth > screenHeight;
          
          // 游戏的标准宽高比 - 尝试不同的比例看哪个效果更好
          // const gameAspectRatio = 16 / 9;  // 1.778 (标准横屏)
          // const gameAspectRatio = 16 / 10; // 1.6 (宽屏显示器常用)
          const gameAspectRatio = 3 / 2;     // 1.5 (可能更适合您的游戏)
          // const gameAspectRatio = 4 / 3;   // 1.333 (传统屏幕比例)
          
          const deviceAspectRatio = screenWidth / screenHeight;
          
          let targetWidth, targetHeight;
          
          console.log(`📐 宽高比详细分析:`, {
            device: `${deviceAspectRatio.toFixed(3)} (${screenWidth}×${screenHeight})`,
            game: `${gameAspectRatio.toFixed(3)} (当前设置: 3:2)`,
            isDeviceWider: deviceAspectRatio > gameAspectRatio,
            difference: `${((deviceAspectRatio - gameAspectRatio) * 100).toFixed(1)}%`,
            recommendation: deviceAspectRatio > gameAspectRatio ? '以高度为准适配' : '以宽度为准适配'
          });
          
          // 高质量基准分辨率
          const baseWidth = 1920;
          const baseHeight = 1080;
          
          // 重要：先计算基于CSS逻辑像素的尺寸，然后适度提升质量
          const qualityScale = Math.min(devicePixelRatio, 2); // 最多2倍质量提升
          
          if (isLandscape) {
            // 横屏：保持游戏比例，适配到屏幕CSS尺寸
            if (deviceAspectRatio > gameAspectRatio) {
              // 设备更宽，以高度为准适配
              const baseHeight = screenHeight;
              const baseWidth = Math.floor(baseHeight * gameAspectRatio);
              targetHeight = Math.floor(baseHeight * qualityScale);
              targetWidth = Math.floor(baseWidth * qualityScale);
              console.log(`🔧 横屏适配 - 设备更宽: CSS(${baseWidth}×${baseHeight}) → Canvas(${targetWidth}×${targetHeight})`);
            } else {
              // 设备较窄，以宽度为准适配  
              const baseWidth = screenWidth;
              const baseHeight = Math.floor(baseWidth / gameAspectRatio);
              targetWidth = Math.floor(baseWidth * qualityScale);
              targetHeight = Math.floor(baseHeight * qualityScale);
              console.log(`🔧 横屏适配 - 设备较窄: CSS(${baseWidth}×${baseHeight}) → Canvas(${targetWidth}×${targetHeight})`);
            }
          } else {
            // 竖屏：使用竖屏适配的分辨率
            targetWidth = Math.floor(screenWidth * qualityScale);
            targetHeight = Math.floor(screenHeight * qualityScale);
            console.log(`🔧 竖屏适配: CSS(${screenWidth}×${screenHeight}) → Canvas(${targetWidth}×${targetHeight})`);
          }
          
          console.log(`📊 最终计算结果:`, {
            orientation: isLandscape ? 'Landscape' : 'Portrait',
            inputScreen: `${screenWidth}×${screenHeight}`,
            outputCanvas: `${targetWidth}×${targetHeight}`,
            canvasAspectRatio: (targetWidth / targetHeight).toFixed(3),
            shouldMatchGame: gameAspectRatio.toFixed(3)
          });
          
          // 确保不超过设备能力和性能限制
          const maxPixels = 2560 * 1440; // 最大像素数限制
          const currentPixels = targetWidth * targetHeight;
          
          if (currentPixels > maxPixels) {
            const scale = Math.sqrt(maxPixels / currentPixels);
            targetWidth = Math.floor(targetWidth * scale);
            targetHeight = Math.floor(targetHeight * scale);
          }
          
          console.log(`📱 Mobile ${isLandscape ? 'Landscape' : 'Portrait'} mode: Using aspect-corrected ${targetWidth}×${targetHeight}`);
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          // 移动端：移除所有样式设置，完全交给inline样式管理
          // 避免resizeCanvas与inline样式的冲突，这是分辨率问题的根源
          
          console.log('🎮 Mobile Canvas Resolution Setup:', {
            internalResolution: `${targetWidth}×${targetHeight}`,
            note: 'CSS样式完全由inline styles管理，避免冲突'
          });
          
          // 更新状态
          setCanvasResolution({ width: targetWidth, height: targetHeight });
          
          console.log('🎮 Mobile fullscreen - CSS Matched Resolution Strategy:', {
            '📱 CSS逻辑像素': `${cssScreenWidth}×${cssScreenHeight}`,
            '🔍 Device Pixel Ratio': devicePixelRatio,
            '⚙️ Quality Scale': qualityScale,
            '🎯 Canvas分辨率': `${targetWidth}×${targetHeight}`,
            '📊 分辨率比例': `${(targetWidth/cssScreenWidth).toFixed(2)}x CSS宽度, ${(targetHeight/cssScreenHeight).toFixed(2)}x CSS高度`,
            '📐 设备宽高比': deviceAspectRatio.toFixed(3),
            '🎮 游戏宽高比': gameAspectRatio.toFixed(3),
            '✅ 关键修复': 'Canvas分辨率基于CSS逻辑像素，应该能看到完整画面',
            '🎨 预期效果': '完整游戏画面，UI居中显示'
          });
          
          // 性能和质量指标
          const pixelCount = targetWidth * targetHeight;
          const megaPixels = (pixelCount / 1000000).toFixed(2);
          console.log(`🚀 Game rendering: ${pixelCount.toLocaleString()} pixels (${megaPixels}MP 全高清质量)`);
        } else {
          // 桌面端：固定使用1920×1080分辨率
          const targetWidth = 1920;
          const targetHeight = 1080;
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // 桌面端CSS样式设置 - 让Container处理定位，Canvas只负责填充
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.maxWidth = 'none';
          canvas.style.maxHeight = 'none';
          canvas.style.objectFit = 'contain'; // 桌面端保持比例，防止拉伸
          canvas.style.imageRendering = 'auto';
          canvas.style.padding = '0';
          canvas.style.margin = '0';
          canvas.style.boxSizing = 'content-box';
          canvas.style.display = 'block'; // 确保正常显示
          
          // 更新状态
          setCanvasResolution({ width: targetWidth, height: targetHeight });
          
          console.log('🖥️ Desktop fullscreen - Fixed Resolution Strategy:', {
            '📱 Physical Screen Size': `${screenWidth}×${screenHeight} CSS像素 (设备真实屏幕)`,
            '🔍 Device Pixel Ratio': devicePixelRatio,
            '📐 Physical Resolution': `${screenWidth * devicePixelRatio}×${screenHeight * devicePixelRatio} 物理像素`,
            '🎯 Game Render Resolution': `${targetWidth}×${targetHeight} (固定全高清质量)`,
            '✨ 分离策略': '游戏分辨率与屏幕尺寸完全独立'
          });
        }
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
            // 基础样式
            background: '#231F20',
            display: error ? 'none' : 'block',
            touchAction: 'none',
            userSelect: 'none',
            
            // 非全屏模式
            ...(!isFullscreen && {
              width: isMobile ? '100%' : '960px',
              height: isMobile ? 'auto' : '600px',
              maxWidth: isMobile ? '100%' : '960px',
              border: '1px solid #444',
              margin: '0 auto',
              imageRendering: 'pixelated',
            }),
            
            // 全屏模式 - 移动端和桌面端分别处理
            ...(isFullscreen && {
              border: 'none',
              margin: 0,
              padding: 0,
              boxSizing: 'content-box',
              imageRendering: 'auto',
              
                            // 移动端：使用固定定位填充整个屏幕，但保持游戏宽高比
              ...(isMobile && {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                maxWidth: 'none',
                maxHeight: 'none',
                minWidth: '100vw',
                minHeight: '100vh',
                zIndex: 10000,
                objectFit: 'contain', // 关键修复：保持宽高比，避免UI变形
                // 使用支持检测的dvh
                ...(CSS.supports('height', '100dvh') && {
                  width: '100dvw',
                  height: '100dvh',
                  minWidth: '100dvw',
                  minHeight: '100dvh',
                }),
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }),
              
              // 桌面端：让Container居中，Canvas填充Container
              ...(!isMobile && {
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain', // 保持比例，避免拉伸
                display: 'block'
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
