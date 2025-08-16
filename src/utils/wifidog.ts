export interface WifiDogConfig {
  authServerUrl: string;
  timeout: number;
}

export const getClientMacAddress = async (): Promise<string> => {
  try {
    // 尝试从网络接口获取MAC地址
    if (navigator.platform.includes('Mac') || navigator.platform.includes('Win')) {
      // 对于桌面环境，尝试使用网络信息API
      const rtcPeerConnection = new RTCPeerConnection({ iceServers: [] });
      const dataChannel = rtcPeerConnection.createDataChannel('mac');
      
      return new Promise((resolve) => {
        rtcPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const macMatch = candidate.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
            if (macMatch) {
              resolve(macMatch[0]);
              return;
            }
          }
          // 如果无法获取真实MAC，生成一个模拟的MAC地址
          resolve(generateFallbackMac());
        };
        
        rtcPeerConnection.createOffer().then(offer => {
          rtcPeerConnection.setLocalDescription(offer);
        });
        
        // 超时后使用fallback
        setTimeout(() => {
          resolve(generateFallbackMac());
        }, 3000);
      });
    } else {
      // 移动设备或其他环境使用fallback
      return generateFallbackMac();
    }
  } catch (error) {
    console.warn('无法获取MAC地址，使用fallback:', error);
    return generateFallbackMac();
  }
};

const generateFallbackMac = (): string => {
  // 生成一个基于浏览器指纹的伪MAC地址
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Browser fingerprint', 2, 2);
  
  const fingerprint = canvas.toDataURL();
  let hash = 0;
  
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 将hash转换为MAC地址格式
  const macBytes = [];
  for (let i = 0; i < 6; i++) {
    macBytes.push(((hash >> (i * 4)) & 0xFF).toString(16).padStart(2, '0'));
  }
  
  return macBytes.join(':');
};

export const buildWifiDogAuthUrl = (config: WifiDogConfig, macAddress: string): string => {
  const url = new URL(config.authServerUrl);
  url.searchParams.set('mac', macAddress);
  url.searchParams.set('timeout', config.timeout.toString());
  
  return url.toString();
};

export const redirectToWifiDogAuth = (config: WifiDogConfig, macAddress: string): void => {
  const authUrl = buildWifiDogAuthUrl(config, macAddress);
  console.log('重定向到WiFiDog认证服务器:', authUrl);
  window.location.href = authUrl;
};