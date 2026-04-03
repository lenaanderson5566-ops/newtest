
const trafficCache = new Map();
const MAX_CACHE_SIZE = 100;


export function formatTraffic(bytes) {
  if (bytes === 0) return '0 B';
  
  if (trafficCache.has(bytes)) {
    return trafficCache.get(bytes);
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const result = parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  
  if (trafficCache.size >= MAX_CACHE_SIZE) {
    const firstKey = trafficCache.keys().next().value;
    trafficCache.delete(firstKey);
  }
  trafficCache.set(bytes, result);
  
  return result;
}


const dateCache = new Map();


export function formatDate(date, withTime = false) {
  if (!date) return '--';
  
  const cacheKey = `${date}_${withTime}`;
  
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey);
  }
  
  let dateObj = date;
  if (typeof date === 'number') {
    dateObj = new Date(date * 1000);
  }
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '--';
  }
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }
  
  let result;
  try {
    result = new Intl.DateTimeFormat('zh-CN', options).format(dateObj);
  } catch(e) {
    const pad = (num) => String(num).padStart(2, '0');
    
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    
    if (withTime) {
      const hours = pad(dateObj.getHours());
      const minutes = pad(dateObj.getMinutes());
      const seconds = pad(dateObj.getSeconds());
      result = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else {
      result = `${year}-${month}-${day}`;
    }
  }
  
  if (dateCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }
  dateCache.set(cacheKey, result);
  
  return result;
}
