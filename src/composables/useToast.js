import { ref } from 'vue';

const toasts = ref([]);
let toastId = 0;

const toastTimers = new Map();
const animationTimers = new Map();
const toastTimes = new Map();

const DEFAULT_TOAST_DURATION = 3000;
const ENTER_ANIMATION_DELAY = 50;
const EXIT_ANIMATION_DURATION = 400;

const clearTimer = (timerMap, id) => {
  const timer = timerMap.get(id);
  if (timer) {
    clearTimeout(timer);
    timerMap.delete(id);
  }
};

export function useToast() {
  const showToast = (message, type = 'info', duration = DEFAULT_TOAST_DURATION) => {
    const finalDuration = Number.isFinite(duration) && duration > 0
      ? duration
      : DEFAULT_TOAST_DURATION;
    
    const id = toastId++;
    
    const toast = {
      id,
      message,
      type,
      show: false, 
      duration: finalDuration
    };
    
    toastTimes.set(id, {
      startTime: Date.now(),
      remainingTime: finalDuration,
      isPaused: false
    });
    
    toasts.value.push(toast);
    
    setTimeout(() => {
      const index = toasts.value.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.value[index].show = true;
      }
    }, ENTER_ANIMATION_DELAY);
    
    startToastTimer(id, finalDuration);
    
    return id;
  };
  
  const startToastTimer = (id, duration) => {
    clearTimer(toastTimers, id);
    
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    toastTimers.set(id, timer);
  };
  
  const pauseToastTimer = (id) => {
    const toastTime = toastTimes.get(id);
    if (!toastTime || toastTime.isPaused) return;
    
    clearTimer(toastTimers, id);
    
    const elapsed = Date.now() - toastTime.startTime;
    toastTime.remainingTime = Math.max(0, toastTime.remainingTime - elapsed);
    toastTime.isPaused = true;
    
    const toastElement = document.querySelector(`.toast[data-id="${id}"] .toast-progress-bar`);
    if (toastElement) {
      const computedStyle = window.getComputedStyle(toastElement);
      const transform = computedStyle.getPropertyValue('transform');
      toastElement.style.transform = transform;
      toastElement.style.animationPlayState = 'paused';
    }
  };
  
  const resumeToastTimer = (id) => {
    const toastTime = toastTimes.get(id);
    if (!toastTime || !toastTime.isPaused) return;
    
    toastTime.startTime = Date.now();
    toastTime.isPaused = false;
    
    startToastTimer(id, toastTime.remainingTime);
    
    const toastElement = document.querySelector(`.toast[data-id="${id}"] .toast-progress-bar`);
    if (toastElement) {
      toastElement.style.animationPlayState = 'running';
    }
  };
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index !== -1) {
      clearTimer(toastTimers, id);
      
      toasts.value[index].show = false;
      
      clearTimer(animationTimers, id);
      
      const timer = setTimeout(() => {
        toasts.value = toasts.value.filter(toast => toast.id !== id);
        animationTimers.delete(id);
        toastTimes.delete(id);
      }, EXIT_ANIMATION_DURATION);
      animationTimers.set(id, timer);
    }
  };
  
  const clearToasts = () => {
    toastTimers.forEach(timer => clearTimeout(timer));
    animationTimers.forEach(timer => clearTimeout(timer));
    toastTimers.clear();
    animationTimers.clear();
    toastTimes.clear();
    
    toasts.value = [];
  };
  
  showToast.success = (message, duration = DEFAULT_TOAST_DURATION) => {
    return showToast(message, 'success', duration);
  };
  
  showToast.error = (message, duration = DEFAULT_TOAST_DURATION) => {
    return showToast(message, 'error', duration);
  };
  
  showToast.warning = (message, duration = DEFAULT_TOAST_DURATION) => {
    return showToast(message, 'warning', duration);
  };
  
  showToast.info = (message, duration = DEFAULT_TOAST_DURATION) => {
    return showToast(message, 'info', duration);
  };
  
  return {
    toasts,
    showToast,
    removeToast,
    pauseToastTimer,
    resumeToastTimer,
    clearToasts
  };
} 
