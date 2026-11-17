//==========================================================================================

function findByAddress(obj, address) {
    if (obj.address === address) return obj;
    if (Array.isArray(obj)) {
        for (const el of obj) {
            const found = findByAddress(el, address);
            if (found) return found;
        }
    } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
            const found = findByAddress(obj[key], address);
            if (found) return found;
        }
    }
    return null;
}

//==========================================================================================

function getParamMinMax(param) {
    const minValue = param?.min;
    const maxValue = param?.max;
    return [minValue, maxValue]
}

//==========================================================================================

function setMotionListeners() {
  const orientationEvent = window.DeviceOrientationEvent;
  if (typeof orientationEvent?.requestPermission === 'function') {
    return orientationEvent.requestPermission().then(permissionState => {
      if (permissionState !== 'granted') {
        throw new Error('Motion sensor permission was not granted.');
      }
    });
  }

  return Promise.resolve();
}

//==========================================================================================

const audioContext = new AudioContext();